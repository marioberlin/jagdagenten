---
name: Porsche Taycan PCM
version: 0.4.0
icon: Car
description: Pixel-perfect replica of the Porsche Taycan PCM infotainment with authentic app tiles, navigation, and media screens.
author: LiquidOS
category: lifestyle
tags: [automotive, porsche, infotainment, navigation, media, taycan]
size: [900, 340]
window: floating
---

```tsx App
export default function App() {
  const [screen, setScreen] = useStorage('screen', 'home')
  const [mediaView, setMediaView] = useStorage('mediaView', 'play')
  const [isPlaying, setIsPlaying] = useStorage('isPlaying', false)

  // Porsche PCM exact colors
  const colors = {
    bg: '#0a0a0a',
    surface: '#161616',
    tile: '#1c1c1c',
    tileHover: '#242424',
    accent: '#00c8ff',
    accentGlow: 'rgba(0,200,255,0.15)',
    text: '#ffffff',
    textMuted: 'rgba(255,255,255,0.5)',
    textSec: 'rgba(255,255,255,0.7)',
    border: 'rgba(255,255,255,0.08)',
    red: '#ff3b30',
    live: '#ff2d55',
  }

  const assets = '/assets/porsche-pcm'

  // App grid items with click handlers
  const apps = [
    { id: 'nav', img: `${assets}/nav.png`, label: 'Navigation', click: () => setScreen('nav') },
    { id: 'media', img: `${assets}/media.png`, label: 'Media', click: () => setScreen('media') },
    { id: 'vehicle', img: `${assets}/vehicle.png`, label: 'Vehicle' },
    { id: 'phone', img: `${assets}/phone.png`, label: 'Phone' },
    { id: 'homelink', img: `${assets}/homelink.png`, label: 'HomeLink' },
    { id: 'climate', img: `${assets}/climate.png`, label: 'Air conditioning' },
    { id: 'notifications', img: `${assets}/notifications.png`, label: 'Notifications' },
    { id: 'devices', img: `${assets}/devices.png`, label: 'Devices' },
    { id: 'carplay', img: `${assets}/carplay.png`, label: 'Apple CarPlay' },
    { id: 'charging', img: `${assets}/charging.png`, label: 'Charging' },
    { id: 'android', img: `${assets}/android.png`, label: 'Android Auto' },
    { id: 'settings', img: `${assets}/settings.png`, label: 'Settings' },
  ]

  // Container
  const containerStyle = {
    display: 'flex',
    width: '100%',
    height: '100%',
    background: colors.bg,
    color: colors.text,
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Porsche Next", sans-serif',
    overflow: 'hidden',
    fontSize: '13px',
  }

  // Sidebar
  const sidebarStyle = {
    width: '52px',
    background: '#050505',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    paddingTop: '8px',
    gap: '4px',
    borderRight: `1px solid ${colors.border}`,
    flexShrink: 0,
  }

  const SidebarBtn = ({ active, icon: Icon, onClick }: { active?: boolean; icon: any; onClick?: () => void }) => (
    <button
      onClick={onClick}
      style={{
        width: '42px',
        height: '42px',
        background: active ? colors.accentGlow : 'transparent',
        border: 'none',
        borderRadius: '10px',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: active ? colors.accent : colors.textMuted,
        transition: 'all 0.15s ease',
      }}
    >
      <Icon size={22} />
    </button>
  )

  // Status bar for all screens  
  const StatusBar = ({ showSearch = true }) => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '12px',
      height: '32px',
    }}>
      {/* Left: Search */}
      {showSearch && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          color: colors.textMuted,
        }}>
          <Search size={16} />
          <span>Search</span>
        </div>
      )}
      {!showSearch && <div />}

      {/* Right: Location + Time + Status Icons */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px',
      }}>
        {/* Location */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '5px', 
          color: colors.textMuted, 
          fontSize: '12px' 
        }}>
          <MapPin size={12} />
          <span>Area West Marketing</span>
          <ChevronDown size={12} />
        </div>
        
        {/* Time */}
        <div style={{ 
          fontSize: '20px', 
          fontWeight: '300',
          letterSpacing: '1px',
          display: 'flex',
          alignItems: 'baseline',
        }}>
          <span style={{ fontWeight: '500' }}>9:11</span>
          <span style={{ fontSize: '11px', marginLeft: '3px', color: colors.textMuted }}>AM</span>
        </div>

        {/* Status icons */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          color: colors.textMuted,
          fontSize: '10px',
        }}>
          <Wifi size={14} />
          <span style={{ 
            padding: '1px 4px', 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: '2px',
            fontSize: '9px',
            fontWeight: '500',
          }}>LTE</span>
        </div>

        {/* More button */}
        <div style={{
          width: '26px',
          height: '26px',
          background: colors.tile,
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <MoreHorizontal size={16} style={{ color: colors.textMuted }} />
        </div>
      </div>
    </div>
  )

  // Home Screen - 6 columns of app tiles
  const HomeScreen = () => (
    <div style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      
      {/* App grid - 6 columns x 2 rows */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '10px',
        flex: 1,
        alignContent: 'start',
      }}>
        {apps.map(app => (
          <button
            key={app.id}
            onClick={app.click}
            style={{
              background: 'none',
              border: 'none',
              cursor: app.click ? 'pointer' : 'default',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <div style={{
              width: '68px',
              height: '68px',
              background: colors.tile,
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              transition: 'background 0.15s ease',
            }}>
              <img 
                src={app.img} 
                alt={app.label}
                style={{ 
                  width: '100%', 
                  height: '100%',
                  objectFit: 'contain',
                }} 
              />
            </div>
            <span style={{ 
              fontSize: '10px', 
              color: colors.textSec,
              textAlign: 'center',
              maxWidth: '72px',
              lineHeight: '1.2',
            }}>
              {app.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )

  // Navigation Screen
  const NavScreen = () => (
    <div style={{ flex: 1, display: 'flex', height: '100%' }}>
      {/* Left panel */}
      <div style={{ width: '280px', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${colors.border}` }}>
        {/* Header */}
        <div style={{ 
          padding: '10px 12px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <button 
            onClick={() => setScreen('home')} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: colors.text, 
              cursor: 'pointer', 
              padding: '4px',
              display: 'flex',
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            background: 'rgba(255,255,255,0.05)', 
            padding: '7px 10px', 
            borderRadius: '8px',
          }}>
            <Search size={14} style={{ color: colors.textMuted }} />
            <span style={{ color: colors.textMuted, fontSize: '13px' }}>Search</span>
          </div>
          <Mic size={18} style={{ color: colors.textMuted }} />
          <MapPin size={18} style={{ color: colors.textMuted }} />
          <MoreHorizontal size={18} style={{ color: colors.textMuted }} />
        </div>

        {/* Tab bar with icons */}
        <div style={{ 
          display: 'flex', 
          padding: '8px 12px',
          gap: '16px',
          borderBottom: `1px solid ${colors.border}`,
        }}>
          {[
            { icon: MapPin, active: true },
            { icon: Star, active: false },
            { icon: Fuel, active: false },
            { icon: Route, active: false },
            { icon: MoreHorizontal, active: false },
          ].map((tab, i) => (
            <div 
              key={i} 
              style={{ 
                padding: '6px',
                color: tab.active ? colors.accent : colors.textMuted,
                borderBottom: tab.active ? `2px solid ${colors.accent}` : '2px solid transparent',
                marginBottom: '-9px',
                cursor: 'pointer',
              }}
            >
              <tab.icon size={16} />
            </div>
          ))}
        </div>

        {/* Destinations list */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {[
            { icon: Home, name: 'Home', addr: 'Add address', special: true },
            { icon: Star, name: 'Work', addr: 'Add address', special: true },
            { icon: MapPin, name: 'Golden Gate Bridge', addr: 'Golden Gate Bridge, San Francisco 94129-9000' },
            { icon: MapPin, name: 'Disneyland', addr: 'Anaheim, CA 92802, USA' },
          ].map((dest, i) => (
            <div 
              key={i} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '12px',
                borderBottom: `1px solid ${colors.border}`,
                cursor: 'pointer',
              }}
            >
              <dest.icon size={16} style={{ color: colors.textMuted, flexShrink: 0 }} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '13px', fontWeight: '500' }}>{dest.name}</div>
                <div style={{ 
                  fontSize: '11px', 
                  color: dest.special ? colors.accent : colors.textMuted, 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                }}>
                  {dest.addr}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map area */}
      <div style={{ 
        flex: 1, 
        background: 'linear-gradient(160deg, #3a5a4a 0%, #1a3528 40%, #152820 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{ textAlign: 'center', color: colors.textMuted }}>
          <Globe size={40} style={{ opacity: 0.4 }} />
          <div style={{ marginTop: '8px', fontSize: '12px' }}>Satellite Map</div>
        </div>
        
        {/* Status overlay */}
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          alignItems: 'flex-end',
          fontSize: '11px',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
            <span style={{ fontWeight: '500', fontSize: '18px' }}>9:11</span>
            <span style={{ color: colors.textMuted }}>AM</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: colors.textMuted }}>
            <Wifi size={12} />
            <span style={{ 
              padding: '1px 4px', 
              background: 'rgba(255,255,255,0.1)', 
              borderRadius: '2px',
              fontSize: '9px',
            }}>LTE</span>
          </div>
        </div>
      </div>
    </div>
  )

  // Media Screen
  const MediaScreen = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 16px' }}>
      {/* Header with tabs and BOSE logo */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {['Play', 'List'].map((tab) => (
            <button
              key={tab}
              onClick={() => setMediaView(tab.toLowerCase())}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '15px',
                fontWeight: '500',
                cursor: 'pointer',
                color: mediaView === tab.toLowerCase() ? colors.accent : colors.textMuted,
                paddingBottom: '6px',
                borderBottom: mediaView === tab.toLowerCase() ? `2px solid ${colors.accent}` : '2px solid transparent',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        
        {/* BOSE Logo */}
        <div style={{ 
          fontFamily: 'system-ui, sans-serif',
          fontWeight: '600', 
          fontSize: '14px', 
          letterSpacing: '4px', 
          color: colors.textMuted,
        }}>
          BOSE
        </div>

        {/* Time & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ fontSize: '18px', fontWeight: '400' }}>9:16</span>
            <span style={{ fontSize: '10px', color: colors.textMuted, marginLeft: '2px' }}>AM</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: colors.textMuted }}>
            <Wifi size={12} />
            <span style={{ fontSize: '9px', padding: '1px 3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>LTE</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: '24px' }}>
        {/* Left section */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Source icons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            {[
              { icon: Music, active: false },
              { icon: Radio, active: true },
              { icon: Headphones, active: false },
              { icon: Star, active: false },
              { icon: MoreHorizontal, active: false },
            ].map((src, i) => (
              <div 
                key={i} 
                style={{ 
                  padding: '8px',
                  borderRadius: '8px',
                  background: src.active ? colors.accentGlow : 'transparent',
                  color: src.active ? colors.accent : colors.textMuted,
                  cursor: 'pointer',
                }}
              >
                <src.icon size={18} />
              </div>
            ))}
          </div>

          {/* Now Playing info */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: '500', 
              color: colors.accent,
              marginBottom: '4px',
            }}>
              Ch 7 - 70s on 7
            </div>
            <div style={{ fontSize: '13px', color: colors.textSec }}>Electric Light Orchestra</div>
            <div style={{ fontSize: '13px', color: colors.textMuted }}>Livin' Thing (76)</div>
          </div>

          {/* Live indicator + progress */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              display: 'inline-block',
              fontSize: '10px', 
              color: colors.live,
              fontWeight: '600',
              marginBottom: '6px',
            }}>
              Live
            </div>
            <div style={{ 
              height: '3px', 
              background: 'rgba(255,255,255,0.1)', 
              borderRadius: '2px',
              overflow: 'hidden',
            }}>
              <div style={{ 
                width: '60%', 
                height: '100%', 
                background: `linear-gradient(90deg, ${colors.accent}, ${colors.accent})`,
                borderRadius: '2px',
              }} />
            </div>
          </div>

          {/* Transport controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', padding: '6px' }}>
              <SkipBack size={18} />
            </button>
            <button style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', padding: '6px' }}>
              <SkipBack size={18} />
            </button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              style={{ 
                width: '44px',
                height: '44px',
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.text,
              }}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: '2px' }} />}
            </button>
            <button style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', padding: '6px' }}>
              <SkipForward size={18} />
            </button>
            <button style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', padding: '6px' }}>
              <SkipForward size={18} />
            </button>
          </div>
        </div>

        {/* Right section - Album art */}
        <div style={{ 
          width: '160px', 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '150px',
            height: '150px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #6a3fa0 0%, #2a1555 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
            <div style={{ 
              textAlign: 'center', 
              color: 'rgba(255,255,255,0.6)',
              fontSize: '10px',
            }}>
              <Music size={36} style={{ opacity: 0.5 }} />
              <div style={{ marginTop: '6px' }}>Electric Light Orchestra</div>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: colors.accent }}>70s on 7</div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button style={{ 
              background: colors.tile, 
              border: 'none', 
              padding: '8px 16px',
              borderRadius: '6px',
              color: colors.textSec,
              fontSize: '11px',
              cursor: 'pointer',
            }}>
              Related
            </button>
            <MoreHorizontal size={18} style={{ color: colors.textMuted }} />
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={containerStyle}>
      {/* Sidebar */}
      <div style={sidebarStyle}>
        <SidebarBtn active={screen === 'home'} icon={Home} onClick={() => setScreen('home')} />
        <SidebarBtn active={screen === 'nav'} icon={Navigation} onClick={() => setScreen('nav')} />
        <SidebarBtn active={screen === 'media'} icon={Music} onClick={() => setScreen('media')} />
        <SidebarBtn icon={Phone} />
        <SidebarBtn icon={Car} />
      </div>

      {/* Main content */}
      {screen === 'home' && <HomeScreen />}
      {screen === 'nav' && <NavScreen />}
      {screen === 'media' && <MediaScreen />}
    </div>
  )
}
```
