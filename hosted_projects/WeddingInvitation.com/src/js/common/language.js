export const lang = (() => {

    const countryMapping = {
        'vi': 'VN',
        'id': 'ID',
        'en': 'US',
        'fr': 'FR',
        'de': 'DE',
        'es': 'ES',
        'zh': 'CN',
        'ja': 'JP',
        'ko': 'KR',
        'ar': 'SA',
        'ru': 'RU',
        'it': 'IT',
        'nl': 'NL',
        'pt': 'PT',
        'tr': 'TR',
        'th': 'TH',
        'ms': 'MY',
        'hi': 'IN',
    };

    /**
     * @type {string|null}
     */
    let country = null;

    /**
     * @type {string|null}
     */
    let locale = null;

    /**
     * @type {string|null}
     */
    let language = null;

    /**
     * @type {Map<string, string>|null}
     */
    let mapping = null;

    return {
        /**
         * @param {string} l 
         * @param {string} val 
         * @returns {this}
         */
        on(l, val) {
            mapping.set(l, val);
            return this;
        },
        /**
         * @returns {string|undefined}
         */
        get() {
            const tmp = mapping.get(language);
            mapping.clear();
            return tmp;
        },
        /**
         * @returns {string|null}
         */
        getCountry() {
            return country;
        },
        /**
         * @returns {string|null}
         */
        getLocale() {
            return locale;
        },
        /**
         * @returns {string|null}
         */
        getLanguage() {
            return language;
        },
        /**
         * @param {string} l 
         * @returns {void}
         */
        setDefault(l) {
            let isFound = true;
            if (!countryMapping[l]) {
                isFound = false;
                console.warn('Không tìm thấy ngôn ngữ, vui lòng thêm thủ công vào countryMapping');
            }

            country = isFound ? countryMapping[l] : 'US';
            language = isFound ? l : 'en';
            locale = `${language}_${country}`;
        },
        /**
         * @returns {void}
         */
        init() {
            mapping = new Map();
            this.setDefault(navigator.language.split('-').shift());
        },
    };
})();