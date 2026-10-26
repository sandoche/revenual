export const defaultCurrency = 'usd'
export const maxPlansDisplayed = 3
export const maxProductsFreemium = 499

export const plans = [
    'crafter_eur',
    'crafter_usd',
    'maker_eur',
    'maker_usd',
    'startup_eur',
    'startup_usd',
    'enterprise_eur',
    'enterprise_usd'
]

export const supportedCurrencies = [
    'eur',
    'usd'
]

// Prices belong to the same Stripe account/environment as the configured API keys.
export const devStripeIdPerSubscriptionType = new Map(plans.map(plan => [plan, process.env['STRIPE_PRICE_' + plan.toUpperCase()] || '']))
export const prodStripeIdPerSubscriptionType = devStripeIdPerSubscriptionType
export const maxMinProductsPerSubscriptionType = new Map([
    [
        'crafter_eur',
        {
            min: 0,
            max: 499,
            currency: 'eur',
            name: 'crafter_eur'
        }
    ],
    [
        'crafter_usd',
        {
            min: 0,
            max: 499,
            currency: 'usd',
            name: 'crafter_usd'
        }
    ],
    [
        'maker_eur',
        {
            min: 500,
            max: 999,
            currency: 'eur',
            name: 'maker_eur'
        }
    ],
    [
        'maker_usd',
        {
            min: 500,
            max: 999,
            currency: 'usd',
            name: 'maker_usd'
        }
    ],
    [
        'startup_eur',
        {
            min: 1000,
            max: 1999,
            currency: 'eur',
            name: 'startup_eur'
        }
    ],
    [
        'startup_usd',
        {
            min: 1000,
            max: 1999,
            currency: 'usd',
            name: 'startup_usd'
        }
    ],
    [
        'enterprise_eur',
        {
            min: 2000,
            max: 999999999999999,
            currency: 'eur',
            name: 'enterprise_eur'
        }
    ],
    [
        'enterprise_usd',
        {
            min: 2000,
            max: 999999999999999,
            currency: 'usd',
            name: 'enterprise_usd'
        }
    ]
])


export const plansDetails = new Map([
    ['crafter_eur', {
        title: 'Crafter',
        description: 'For hobbies',
        min: maxMinProductsPerSubscriptionType.get('crafter_eur').min,
        max: maxMinProductsPerSubscriptionType.get('crafter_eur').max,
        price: 0,
        currency: '€',
        code: 'crafter_eur',
        planName: 'crafter',
        currencyText: 'eur'
    }],
    ['crafter_usd', {
        title: 'Crafter',
        description: 'For hobbies',
        min: maxMinProductsPerSubscriptionType.get('crafter_usd').min,
        max: maxMinProductsPerSubscriptionType.get('crafter_usd').max,
        price: 0,
        currency: '$',
        code: 'crafter_usd',
        planName: 'crafter',
        currencyText: 'usd'
    }],
    ['maker_eur', {
        title: 'Maker',
        description: 'For pros',
        min: maxMinProductsPerSubscriptionType.get('maker_eur').min,
        max: maxMinProductsPerSubscriptionType.get('maker_eur').max,
        price: 5,
        currency: '€',
        code: 'maker_eur',
        planName: 'maker',
        currencyText: 'eur'
    }],
    ['maker_usd', {
        title: 'Maker',
        description: 'For pros',
        min: maxMinProductsPerSubscriptionType.get('maker_usd').min,
        max: maxMinProductsPerSubscriptionType.get('maker_usd').max,
        price: 5,
        currency: '$',
        code: 'maker_usd',
        planName: 'maker',
        currencyText: 'usd'
    }],
    ['startup_eur', {
        title: 'Startup',
        description: 'For small businesses',
        min: maxMinProductsPerSubscriptionType.get('startup_eur').min,
        max: maxMinProductsPerSubscriptionType.get('startup_eur').max,
        price: 12,
        currency: '€',
        code: 'startup_eur',
        planName: 'startup',
        currencyText: 'eur'
    }],
    ['startup_usd', {
        title: 'Startup',
        description: 'For small businesses',
        min: maxMinProductsPerSubscriptionType.get('startup_usd').min,
        max: maxMinProductsPerSubscriptionType.get('startup_usd').max,
        price: 12,
        currency: '$',
        code: 'startup_usd',
        planName: 'startup',
        currencyText: 'usd'
    }],
    ['enterprise_eur', {
        title: 'Enterprise',
        description: 'For growing businesses',
        min: maxMinProductsPerSubscriptionType.get('enterprise_eur').min,
        max: maxMinProductsPerSubscriptionType.get('enterprise_eur').max,
        price: Infinity,
        currency: '€',
        code: 'enterprise_eur',
        planName: 'enterprise',
        currencyText: 'eur'
    }],
    ['enterprise_usd', {
        title: 'Enterprise',
        description: 'For growing businesses',
        min: maxMinProductsPerSubscriptionType.get('enterprise_usd').min,
        max: maxMinProductsPerSubscriptionType.get('enterprise_usd').max,
        price: Infinity,
        currency: '$',
        code: 'enterprise_usd',
        planName: 'enterprise',
        currencyText: 'usd'
    }]
])

