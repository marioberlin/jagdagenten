-- ============================================================================
-- Huntcraft Challenges Schema
-- ============================================================================
-- Gamified challenge system for skill development
-- Privacy-first: progress is personal, no leaderboards
-- ============================================================================

-- Challenge Definitions (system-defined templates)
CREATE TABLE IF NOT EXISTS challenge_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL, -- 'silent_approach' | 'wind_perfect' | 'journal' | 'zero_check'
    target_value INTEGER NOT NULL DEFAULT 1,
    period TEXT NOT NULL DEFAULT 'weekly', -- 'daily' | 'weekly' | 'monthly'
    xp_reward INTEGER NOT NULL DEFAULT 25,
    category TEXT NOT NULL DEFAULT 'skill', -- 'skill' | 'maintenance' | 'learning'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Challenge Progress
CREATE TABLE IF NOT EXISTS user_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES challenge_templates (id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (
        user_id,
        template_id,
        period_start
    )
);

-- User XP & Level Tracking
CREATE TABLE IF NOT EXISTS user_huntcraft_stats (
    user_id UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    total_xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    challenges_completed INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_challenge_date DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievement Definitions
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    tier TEXT NOT NULL DEFAULT 'bronze', -- 'bronze' | 'silver' | 'gold'
    requirement_type TEXT NOT NULL, -- 'challenges_completed' | 'xp_earned' | 'streak'
    requirement_value INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements (id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, achievement_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON user_challenges (user_id);

CREATE INDEX IF NOT EXISTS idx_user_challenges_period ON user_challenges (period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements (user_id);

-- ============================================================================
-- Seed: Default Challenge Templates
-- ============================================================================

INSERT INTO
    challenge_templates (
        slug,
        title,
        description,
        icon,
        target_value,
        period,
        xp_reward,
        category
    )
VALUES (
        'silent_approach_3',
        '3 Stille Ansitze',
        'Absolviere 3 Ansitze ohne deine Position zu verraten',
        'silent_approach',
        3,
        'weekly',
        50,
        'skill'
    ),
    (
        'wind_perfect_2',
        '2 Wind-Perfekte Sitze',
        'Positioniere dich 2x perfekt zum Wind',
        'wind_perfect',
        2,
        'weekly',
        40,
        'skill'
    ),
    (
        'journal_week',
        'Saubere Journal-Woche',
        'Führe 7 Tage am Stück dein Jagdtagebuch',
        'journal',
        7,
        'weekly',
        75,
        'learning'
    ),
    (
        'zero_check_1',
        'Nullpunkt-Check',
        'Überprüfe den Nullpunkt einer Waffe',
        'zero_check',
        1,
        'weekly',
        30,
        'maintenance'
    ),
    (
        'sighting_report_5',
        '5 Sichtungen melden',
        'Melde 5 Wildsichtungen an die Community',
        'silent_approach',
        5,
        'weekly',
        60,
        'skill'
    ),
    (
        'gear_maintenance',
        'Ausrüstungs-Wartung',
        'Führe eine Wartungsaufgabe durch',
        'zero_check',
        1,
        'weekly',
        25,
        'maintenance'
    ) ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- Seed: Default Achievements
-- ============================================================================

INSERT INTO
    achievements (
        slug,
        title,
        description,
        tier,
        requirement_type,
        requirement_value
    )
VALUES (
        'first_challenge',
        'Erste Schritte',
        'Erste Herausforderung abgeschlossen',
        'bronze',
        'challenges_completed',
        1
    ),
    (
        'ten_challenges',
        'Fleißiger Waidmann',
        '10 Herausforderungen abgeschlossen',
        'bronze',
        'challenges_completed',
        10
    ),
    (
        'fifty_challenges',
        'Erfahrener Jäger',
        '50 Herausforderungen abgeschlossen',
        'silver',
        'challenges_completed',
        50
    ),
    (
        'hundred_challenges',
        'Meisterjäger',
        '100 Herausforderungen abgeschlossen',
        'gold',
        'challenges_completed',
        100
    ),
    (
        'week_streak_4',
        'Monatliche Konstanz',
        '4 Wochen in Folge aktiv',
        'bronze',
        'streak',
        4
    ),
    (
        'week_streak_12',
        'Quartals-Champion',
        '12 Wochen in Folge aktiv',
        'silver',
        'streak',
        12
    ),
    (
        'xp_500',
        'XP-Sammler',
        '500 XP gesammelt',
        'bronze',
        'xp_earned',
        500
    ),
    (
        'xp_2500',
        'XP-Meister',
        '2500 XP gesammelt',
        'silver',
        'xp_earned',
        2500
    ),
    (
        'wind_master',
        'Wind-Meister',
        '10 wind-perfekte Ansitze absolviert',
        'silver',
        'challenges_completed',
        10
    ),
    (
        'journal_keeper',
        'Tagebuch-Schreiber',
        'Erste vollständige Journal-Woche',
        'bronze',
        'challenges_completed',
        1
    ) ON CONFLICT (slug) DO NOTHING;