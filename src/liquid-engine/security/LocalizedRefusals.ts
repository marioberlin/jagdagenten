/**
 * LocalizedRefusals.ts
 * 
 * Pre-defined refusal messages in multiple languages.
 * Used when the Guard Dog blocks a request.
 */

// ============================================================================
// REFUSAL MESSAGES
// ============================================================================

export const LOCALIZED_REFUSALS: Record<string, string> = {
    en: "I'm sorry, I can't help with that request.",
    es: "Lo siento, no puedo ayudar con esa solicitud.",
    de: "Es tut mir leid, ich kann bei dieser Anfrage nicht helfen.",
    fr: "Je suis désolé, je ne peux pas répondre à cette demande.",
    it: "Mi dispiace, non posso aiutarti con questa richiesta.",
    pt: "Desculpe, não posso ajudar com esse pedido.",
    zh: "抱歉，我无法处理此请求。",
    ja: "申し訳ありませんが、そのリクエストにはお応えできません。",
    ko: "죄송합니다. 해당 요청에는 도움을 드릴 수 없습니다.",
    ar: "عذرًا، لا أستطيع المساعدة في هذا الطلب.",
    hi: "क्षमा करें, मैं इस अनुरोध में मदद नहीं कर सकता।",
    ru: "Извините, я не могу помочь с этим запросом.",
    nl: "Sorry, ik kan niet helpen met dat verzoek.",
    pl: "Przepraszam, nie mogę pomóc z tą prośbą.",
    tr: "Üzgünüm, bu istekte size yardımcı olamam.",
    vi: "Xin lỗi, tôi không thể giúp với yêu cầu đó.",
    th: "ขออภัย ฉันไม่สามารถช่วยเหลือในคำขอนั้นได้",
    unknown: "I'm sorry, I can't help with that request.", // Fallback to English
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the localized refusal message for a given language code.
 * Falls back to English if the language is not supported.
 */
export function getRefusalMessage(languageCode: string): string {
    const normalizedCode = languageCode.toLowerCase().split('-')[0]; // Handle 'en-US' -> 'en'
    return LOCALIZED_REFUSALS[normalizedCode] || LOCALIZED_REFUSALS['en'];
}

/**
 * Check if a language is supported for localized refusals.
 */
export function isLanguageSupported(languageCode: string): boolean {
    const normalizedCode = languageCode.toLowerCase().split('-')[0];
    return normalizedCode in LOCALIZED_REFUSALS && normalizedCode !== 'unknown';
}

/**
 * Get all supported language codes.
 */
export function getSupportedLanguages(): string[] {
    return Object.keys(LOCALIZED_REFUSALS).filter(code => code !== 'unknown');
}
