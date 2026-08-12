/**
 * Pause Money's vocabulary.
 *
 * Every user-facing string that touches money routes through this file.
 * No screen or component should hardcode finance words directly — this is
 * what keeps the app's language consistent as it grows, and it's the single
 * place to evolve tone later.
 *
 * House rules:
 *  - "Budget"        -> never used. See Available / Protected.
 *  - "Expenses"       -> never used. See Protected / Commitments.
 *  - "Transactions"   -> never used. See Decisions / History.
 *  - "Spend" as a noun is fine ("Safe to Spend"); "spending" as a judgment
 *    word ("overspending", "spending problem") is avoided entirely.
 */

export const Copy = {
  // Core account states — replace "budget categories"
  available: "Available",
  protected: "Protected",
  safeToSpend: "Safe to Spend",
  futureYou: "Future You",

  // The signature flow
  checkpoint: "Decision Mode",
  decision: "Decision",
  pause: "Pause",
  continue_: "Continue",
  reconsider: "Reconsider",

  // Supporting vocabulary
  history: "Decisions", // replaces "Transactions"
  commitments: "Protected for", // replaces "Expenses" / "Bills"
  moveMoney: "Set aside", // replaces "Save" as a CTA verb, avoids preachy tone
  overCommitted: "Stretched thin", // replaces "Over budget"
  onTrack: "Steady", // replaces "On budget"
  cushion: "Cushion", // replaces "Buffer" / "Emergency fund"

  portal: {
    prompt: "Ready to make a decision?",
  },

  home: {
    title: "Pause Money",
    subtitle: "A quiet look at where you stand.",
    availableLabel: "Available today",
    availableLabelGeneric: "Available",
    safeToSpendExplainerTitle: "Safe to Spend",
    safeToSpendExplainerBody:
      "What's left after your bills, savings goals, and already-logged decisions are accounted for — not just your raw account balance. It updates the moment any of those change.",
    protectedLabel: "Protected this month",
    futureYouLabel: "Future You is holding",
    comingInSummaryLabel: "Coming in",
    comingInSectionTitle: "What's coming in",
    incomeNamePlaceholder: "Where's it from? (e.g. Paycheck, Freelance)",
    incomeAnchorDatePlaceholder: "Last payday (YYYY-MM-DD)",
    emptyIncome: "Nothing added yet.",
    addIncomeCta: "Add what's coming in",
    debtSectionTitle: "Paying down",
    emptyDebt: "Nothing added yet.",
    addDebtCta: "Add something you're paying down",
    spentSoFar: (amount: string, monthPhrase: string) => `${amount} ${monthPhrase} — on pace`,
    spentOverBy: (spent: string, over: string, monthPhrase: string) =>
      `${spent} ${monthPhrase} — ${over} past what you'd planned`,
    jumpToTodayCta: "Jump to this month",
    availableSubtitlePast: (month: string) => `What was left in ${month}`,
    availableSubtitleFuture: "Projected — before any purchases",
    weeklyInsight: (amount: string, category: string, count: number) =>
      `${amount} on ${category} in the past week, across ${count} ${count === 1 ? "decision" : "decisions"}.`,
    weeklyInsightLabel: "Worth knowing",
    trendUp: (category: string, percent: number) => `${category} is up ${percent}% over the last 30 days.`,
    trendDown: (category: string, percent: number) => `${category} is down ${Math.abs(percent)}% over the last 30 days.`,
    investingInYourself: (amount: string) => `You invested ${amount} in yourself this month.`,
    dollarJobsTitle: "Where it's going",
    recurringChargesLabel: "Still paying for these",
    recurringCharge: (merchant: string, amount: string, months: number) =>
      `${merchant} — ${amount}, ${months} months running`,
    confidenceLabel: "Financial Confidence",
    confidenceBillsCovered: "Bills covered",
    confidenceSavingsOnTrack: "Savings on track",
    confidenceSpendingWithinBudget: "Spending within budget",
    streakLabel: "Weeks Protected",
    streakBodyActive: (weeks: number) =>
      `${weeks} ${weeks === 1 ? "week" : "weeks"} in a row pausing before you buy.`,
    streakBodyEmpty: "Pause on a purchase this week to start your streak.",
    safeSpendingDaysWithAllowance: (days: number, amount: string) =>
      `About ${amount} a day feels comfortable for the next ${days} ${days === 1 ? "day" : "days"}, until payday.`,
    safeSpendingDaysOnly: (days: number) => `${days} ${days === 1 ? "day" : "days"} until payday.`,
    statusOnTrack: "You're on track.",
    statusCategoryOver: "A couple of categories are running a bit high.",
    statusOverAvailable: "You're past what's available this month.",
    timelineTitle: "Timeline",
    timelineToday: "Today",
    timelineYesterday: "Yesterday",
    timelineEmpty: "Nothing yet — your decisions and bank activity will show up here.",
    timelineBought: "Bought",
    timelineSaved: "Saved",
    timelineCancelled: "Cancelled",
  },

  reminders: {
    cardTitle: "Check-ins",
    cardSubtitle: "A quiet nudge before your usual spending moments — never a lecture.",
    toggleLabel: "Weekly check-in",
    scheduledNote: (days: string, time: string) => `Set for ${days} at ${time}.`,
    dayLabel: "Day",
    timeLabel: "Time",
    fridayNotificationTitle: "A moment to check in",
    fridayNotificationBody: "Take a quiet look at where you stand before you head out.",
    moneyProtectedLine: (amount: string) => `You protected ${amount} by pausing or reconsidering this week.`,
    pauseWinsLine: (pauses: number, skipped: number) =>
      skipped > 0
        ? `You paused ${pauses} ${pauses === 1 ? "time" : "times"} and skipped ${skipped} ${skipped === 1 ? "purchase" : "purchases"} this week.`
        : `You paused ${pauses} ${pauses === 1 ? "time" : "times"} this week.`,
    webUnsupportedNote: "Check-ins arrive as notifications, which need the iOS or Android app.",
    permissionDeniedNote: "Notifications are off for Pause Money — enable them in your device settings first.",
    winbackTitle: "We miss you",
    winbackBody: "It's been a couple weeks — your Safe to Spend and goals are still right where you left them.",
  },

  decisionRecorded: {
    pausedTitle: "Pause complete",
    pausedBody: (amount: string) => `You took a moment before spending — ${amount} stayed put while you did.`,
    reconsideredTitle: "Pause complete",
    reconsideredBody: (amount: string) => `You paused, thought it through, and skipped it. ${amount} stayed in your account.`,
    continuedTitle: "Good decision",
    continuedBody: "You paused, considered it, and chose intentionally. That's the whole idea.",
    doneCta: "Done",
    shareCta: "Share this win",
    shareMessage: (amount: string, code: string) =>
      `I just kept ${amount} by pausing before I bought something I didn't need — Pause Money made me wait. Use my code ${code} when you join: pausemoney://referral?code=${code}`,
  },

  referrals: {
    title: "Invite friends",
    subtitle: "When Premium launches, you and everyone you invite get 30 days free.",
    yourCodeLabel: "Your code",
    invitesSentLabel: (n: number) => `${n} ${n === 1 ? "friend has" : "friends have"} joined with your code`,
    daysBankedLabel: (days: number) => `${days} Premium ${days === 1 ? "day" : "days"} banked`,
    daysBankedNote: "Banked now, unlocked the day Premium ships — nothing to redeem yet.",
    shareCta: "Share your code",
    shareMessage: (code: string) =>
      `I've been using Pause Money to think twice before buying things I don't need. Use my code ${code} when you sign up — we both get 30 days of Premium once it launches. pausemoney://referral?code=${code}`,
    enterCodeLabel: "Have a friend's code?",
    enterCodePlaceholder: "Enter code",
    redeemCta: "Redeem",
    redeemSuccess: (days: number) => `Code applied — ${days} Premium days banked for both of you.`,
    redeemErrorInvalidCode: "That code doesn't match anyone.",
    redeemErrorSelfReferral: "That's your own code.",
    redeemErrorAlreadyUsed: "You've already used a referral code.",
    redeemErrorUnavailable: "Referrals need an account — sign in first.",
    redeemErrorUnknown: "Something went wrong. Try again.",
    demoNote: "Referrals need a real account to work — this is a preview in demo mode.",
  },

  milestones: {
    firstGoalReachedTitle: "Goal reached 🎉",
    firstGoalReachedBody: (goalName: string) => `You've reached your "${goalName}" goal. Take a moment — you built this.`,
    firstProtectedTitle: "Your first pause",
    firstProtectedBody: "You just chose to pause instead of buy. That's the whole idea — nice work.",
    thirtyDaysTitle: "30 days in",
    thirtyDaysBody: "You've been building this habit for a month now. It's starting to become who you are.",
  },

  pauseWins: {
    title: "Pause Wins",
    weeklyLabel: "This week",
    lifetimeLabel: "Lifetime",
    pausesLabel: (n: number) => `${n} ${n === 1 ? "pause" : "pauses"}`,
    skippedLabel: (n: number) => `${n} skipped`,
    keptLabel: (amount: string) => `${amount} kept`,
    intentionalRateLabel: (percent: number) => `You stepped back to think ${percent}% of the time.`,
    levelProgressLabel: (remaining: number, name: string) =>
      `${remaining} more ${remaining === 1 ? "pause" : "pauses"} to ${name}`,
    emptyBody: "Pause on a purchase to start your first win.",
  },

  bigPurchaseMode: {
    cardTitle: "Big Purchase Mode",
    cardSubtitle: "Above a threshold you set, Decision Mode adds a few extra questions worth sitting with.",
    toggleLabel: "Big Purchase Mode",
    thresholdLabel: "Threshold",
  },

  nightPause: {
    promptTitle: "We've noticed something",
    promptBody: (dayName: string, timeRange: string) =>
      `Your purchases most often land on ${dayName}s, ${timeRange}. Want a longer pause during that window?`,
    promptBodyWithApp: (dayName: string, timeRange: string, appName: string) =>
      `Your purchases most often land on ${dayName}s, ${timeRange} — around when you said ${appName} tempts you. Want a longer pause during that window?`,
    acceptCta: "Turn on Night Pause",
    declineCta: "Not now",
    cardTitle: "Night Pause",
    cardSubtitle: (dayName: string, timeRange: string) => `Extra friction on ${dayName}s, ${timeRange}.`,
    toggleLabel: "Night Pause",
  },

  pauseIntensity: {
    cardTitle: "Pause intensity",
    cardSubtitle: "How much friction Decision Mode adds as a purchase gets bigger — and how long the pause lasts. Change this anytime.",
    gentleLabel: "Gentle",
    standardLabel: "Standard",
    strongLabel: "Strong",
    strictLabel: "Strict",
    strictNote: "The longest pause Pause Money can add today — not a real app lock.",
  },

  appLock: {
    cardTitle: "App lock",
    cardSubtitle:
      "Require Face ID, fingerprint, or your device passcode after Pause Money has been in the background a while.",
    toggleLabel: "Require unlock",
    unavailableNote: "Set up a fingerprint, face unlock, or a screen lock on this device to use this.",
    title: "Pause Money is locked",
    subtitle: "Unlock to see your accounts and decisions.",
    failedNote: "That didn't go through — try again.",
    unlockCta: "Unlock",
  },

  places: {
    title: "Places to watch",
    subtitle:
      "Mark a spot — a mall, your usual coffee shop — and Pause Money offers a quiet check-in when you're nearby. Never a lecture, never automatic.",
    addCta: "Add this place",
    savingLabel: "Getting your location…",
    namePlaceholder: "What should we call this place?",
    saveCta: "Save this location",
    cancelCta: "Cancel",
    detectedPlaceLabel: "Here's where you are — add it as a place to watch?",
    detectedPlaceFallbackLabel: "We couldn't identify this spot by name, but the location's ready — give it a name:",
    emptyState: "No places yet — add one to get a nudge when you're nearby.",
    removeCta: "Remove",
    radiusNote: (meters: number) => `${meters}m radius`,
    permissionDeniedNote:
      "Location access is off for Pause Money — enable location access in your device settings to use this.",
    foregroundNote:
      "Location access for background arrival nudges is off, so Pause Money only checks when you open the app — enable \"Allow all the time\" in your device's location settings for Pause Money to get a nudge the moment you arrive.",
    backgroundNote:
      "Pause Money checks for arrival at these places in the background, only to offer a quiet nudge — no continuous tracking, no persistent notification.",
    nearbyBannerTitle: (place: string) => `You're near ${place}`,
    nearbyBannerBody: "Want to pause before you shop today?",
    nearbyBannerCta: "Open Decision Mode",
    nearbyBannerDismissCta: "Not now",
  },

  spendingWall: {
    title: "Pause Money",
    prompt: "Decision Mode",
    financialAlignmentLabel: "Financial Alignment",
    financialAlignmentExplainerTitle: "Financial Alignment",
    financialAlignmentExplainerBody:
      "How well this specific purchase fits what's already scheduled — your bills, your goals, what you've told this app matters to you. A low score doesn't mean \"don't buy it,\" just \"look at what it costs you.\"",
    question: "Is this worth it, right now?",
    pauseHint: "Take a breath. This screen won't rush you.",
    reflectionPauseHint: "This one's worth sitting with a little longer.",
    continueLabel: "Continue",
    pauseLabel: "Pause",
    reconsiderLabel: "Not right now",
    readAloudCta: "Read summary aloud",
    readingAloudLabel: "Reading…",
    stopReadingCta: "Stop reading",
    categoryBudgetLabel: (category: string) => `Your ${category} habit this month`,
    categoryBudgetOkMessage: (spent: string, budget: string) =>
      `${spent} of ${budget} so far — right where you want to be.`,
    categoryBudgetOverMessage: (spent: string, budget: string, over: string) =>
      `${spent} of ${budget} — that's ${over} past what you'd planned.`,
    bigPurchaseTitle: "Worth sitting with",
    bigPurchaseQuestions: [
      "Do you still want this in a week?",
      "Is this replacing something?",
      "Is this part of your plan?",
    ],
    ledgerAvailableNowLabel: "Available now",
    ledgerAfterPurchaseLabel: "After purchase",
    ledgerSafeDaysLabel: "Safe spending days",
    ledgerSafeDaysValue: (days: number) => `${days} ${days === 1 ? "day" : "days"}`,
    ledgerCategoryLabel: (category: string) => `${category} this month`,
    ledgerGoalImpactLabel: (goal: string) => `${goal} impact`,
  },

  pauseReasonCallback: {
    merchantLabel: (merchant: string, reason: string) =>
      `Last time at ${merchant}, you said "${reason}" — still feels that way?`,
    categoryLabel: (category: string, reason: string) =>
      `Last time you paused on ${category}, you said "${reason}" — still feels that way?`,
  },

  pauseReasonStep: {
    title: "Want to note why?",
    subtitle: "Totally optional — it's just for you.",
    reasons: [
      "Saving for something bigger.",
      "Didn't really need it.",
      "Will think about it later.",
      "Too expensive.",
      "Changed my mind.",
    ],
    somethingElseCta: "Something else…",
    somethingElsePlaceholder: "What's the real reason?",
    skipCta: "Skip",
    confirmCta: "Done",
  },

  purchaseIntentStep: {
    title: "Why?",
    subtitle: "What's this purchase for?",
    skipCta: "Skip",
  },

  newDecision: {
    title: "Enter Decision Mode",
    subtitle: "What are you about to buy?",
    merchantPlaceholder: "Merchant or item",
    amountPlaceholder: "$ amount",
    categoryLabel: "Category",
    continueCta: "Continue to Decision Mode",
    speakCta: "Speak instead",
    listeningLabel: "Listening…",
    voiceHint: "Try “Dinner for 45 dollars”",
    voiceHeard: (transcript: string) => `Heard: “${transcript}”`,
    addNameCta: "Add a name (optional)",
  },

  futureYouScreen: {
    title: "Future You",
    subtitle: "What today's decisions are building.",
    projectionLabel: "At this pace, in 12 months",
    notEnoughHistoryNote: "Check back after a few months of activity to see a real trend here.",
    visionSectionTitle: "Your Future Self",
    visionEmpty: "You haven't set one yet — what does financial freedom look like to you?",
    addVisionCta: "Add",
    goalCardTitle: "Savings goal",
    goalsSectionTitle: "Savings goals",
    noGoalLabel: "No goal set yet",
    goalsSummaryLabel: (count: number) => `${count} ${count === 1 ? "goal" : "goals"}`,
    editGoalCta: "Edit goal",
    addGoalCta: "Add a goal",
    removeGoalCta: "Remove",
    aheadTitle: "What's ahead",
    aheadSubtitle: "Your next 45 days, based on what's already scheduled.",
    aheadEmpty: "Nothing scheduled yet — add income or a bill with a day of the month to see it here.",
    aheadLowPoint: (amount: string, date: string) => `Lowest point: ${amount} on ${date}`,
    aheadShortfallWarning: (amount: string, date: string) => `This dips ${amount} below zero on ${date}.`,
  },

  challenges: {
    sectionTitle: "Challenges",
    noSpendWeekName: "No-Spend Week",
    noSpendWeekDescription: "7 days, no “continued” purchases logged. Pausing or reconsidering doesn't break it.",
    startCta: "Start a No-Spend Week",
    inProgress: (daysElapsed: number, daysTotal: number) => `Day ${daysElapsed} of ${daysTotal}`,
    failed: "This one didn't land — you can start a fresh one anytime.",
    completed: "Complete! A full week without an unplanned purchase.",
    cancelCta: "Cancel challenge",
  },

  whatIfEngine: {
    title: "What if?",
    subtitle: "See how a change to your monthly spending or saving would play out.",
    amountPlaceholder: "$ amount a month",
    saveMoreCta: "Save more",
    spendMoreCta: "Spend more",
    seeCta: "See what happens",
  },

  commitmentsScreen: {
    fixedSectionTitle: "Already spoken for — same every month",
    variableSectionTitle: "Your habits — a monthly amount you set",
    emptyFixed: "Nothing added yet.",
    emptyVariable: "Nothing added yet.",
    addFixedCta: "Add a responsibility",
    addVariableCta: "Add a habit",
    namePlaceholder: "Name (e.g. Rent, Groceries)",
    amountPlaceholder: "$ amount per month",
    dayOfMonthPlaceholder: "Day of month, optional (e.g. 1)",
    categoryLabel: "Matches purchase category",
    saveCta: "Save",
    cancelCta: "Cancel",
    removeCta: "Remove",
    totalLabel: "Total protected",
  },

  savingsGoalStep: {
    title: "What's the dream you're building toward?",
    subtitle: "A cushion, a trip, a new place — whatever it is, Pause Money will give you a heads-up before a purchase dips into it.",
    namePlaceholder: "What are you working toward? (e.g. Cushion, Trip, New car)",
    amountPlaceholder: "$ target amount",
    skipCta: "Skip for now",
  },

  onboardingPauseRule: {
    appsTitle: "Which apps tempt you most?",
    appsSubtitle: "Pick as many as apply — totally optional, and just for you.",
    appOptions: ["Amazon", "Temu", "Shein", "DoorDash", "Uber Eats", "TikTok Shop", "Best Buy", "Other"],
    thresholdTitle: "When should we make you pause?",
    thresholdSubtitle: "You can change this anytime in Settings.",
    continueCta: "Continue",
    skipCta: "Skip for now",
  },

  onboardingResponsibilities: {
    title: "What's already spoken for?",
    subtitle: "Rent, a phone bill, anything that leaves your account the same way every month. One's enough to start — add more anytime.",
  },

  onboardingHabits: {
    title: "What's a spending habit you have?",
    subtitle: "Coffee, eating out, something you buy often. Pause Money uses this to notice patterns, not to judge them.",
  },

  futureVisionStep: {
    title: "What does financial freedom look like to you?",
    subtitle: "A short phrase is plenty — Pause Money will bring it back up at the moments it actually matters.",
    placeholder: "e.g. Buying my first house, Never worrying about bills",
    saveCta: "Save",
    skipCta: "Skip for now",
    editCta: "Edit",
  },

  decisionsScreen: {
    title: "Decisions",
    subtitle: "Every decision, and how it went.",
    empty: "No decisions yet — they'll show up here after your first decision.",
    replayTitle: (month: string) => `Your ${month}, so far`,
    moneyProtectedLabel: (amount: string) => `${amount} protected by pausing or reconsidering`,
    topReasonLabel: (reason: string) => `Most common reason: "${reason}"`,
    exportCta: "Export history",
    exportingLabel: "Preparing export…",
    exportUnsupported: "Exporting isn't available on this device.",
    exportError: "That didn't go through. Try again.",
    markRegrettedCta: "Mark as regretted",
    regrettedLabel: "Regretted",
    unmarkRegrettedCta: "Unmark",
    searchPlaceholder: "Search by merchant or category",
    filterAll: "All",
    filterPaused: "Paused",
    filterReconsidered: "Reconsidered",
    filterContinued: "Continued",
    noResults: "Nothing matches that search.",
  },

  decisionMemoryCallback: {
    merchantLabel: (merchant: string) =>
      `Last time you bought from ${merchant}, you told us you regretted it. Not to stop you — just to help you remember.`,
    categoryLabel: (category: string) =>
      `Last time you bought ${category.toLowerCase()}, you told us you regretted it. Not to stop you — just to help you remember.`,
  },

  outcomeLabel: {
    continued: "Continued",
    paused: "Paused",
    reconsidered: "Reconsidered",
  } as const,

  auth: {
    signInTitle: "Welcome back",
    signInSubtitle: "Continue where you left off.",
    signUpTitle: "Start with Pause Money",
    signUpSubtitle: "A calmer way to see your money.",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Password",
    signInCta: "Continue",
    signUpCta: "Create account",
    switchToSignUp: "New here? Create an account",
    switchToSignIn: "Already have an account? Sign in",
  },

  deleteAccount: {
    cta: "Delete account",
    confirmTitle: "Delete your account?",
    confirmBody: "This permanently removes your account and everything in it — decisions, goals, income, bills, and any linked bank connection. There's no undo.",
    confirmCta: "Yes, delete everything",
    cancelCta: "Cancel",
    deletingLabel: "Deleting…",
    errorFallback: "That didn't go through. Try again.",
  },

  clearData: {
    cta: "Clear data",
    confirmTitle: "Clear all your data?",
    confirmBody: "This erases every decision, goal, bill, income source, watched place, and bank connection — and resets Big Purchase Mode and check-in reminders to their defaults. Your account and sign-in stay, and you'll go back through the intro. There's no undo.",
    confirmCta: "Yes, clear everything",
    cancelCta: "Cancel",
    clearingLabel: "Clearing…",
    errorFallback: "That didn't go through. Try again.",
  },

  linkAccount: {
    title: "Connect your bank",
    subtitle:
      "Pause Money reads your balances and recent activity — it can't move money. Your login stays with your bank.",
    connectCta: "Connect a bank account",
    connectedLabel: "Connected",
    unlinkedLabel: "Not connected yet",
    syncingLabel: "Bringing in your accounts…",
    errorFallback: "That didn't go through. Try again.",
    unlinkCta: "Disconnect this bank",
    unlinkingLabel: "Disconnecting…",
    unlinkErrorFallback: "Couldn't disconnect — try again.",
  },
} as const;

export type CopyKey = keyof typeof Copy;
