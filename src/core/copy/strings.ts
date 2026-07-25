/**
 * Checkpoint's vocabulary.
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
  checkpoint: "Checkpoint",
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
    title: "Checkpoint",
    subtitle: "A quiet look at where you stand.",
    availableLabel: "Available today",
    availableLabelGeneric: "Available",
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
    recurringChargesLabel: "Still paying for these",
    recurringCharge: (merchant: string, amount: string, months: number) =>
      `${merchant} — ${amount}, ${months} months running`,
    confidenceLabel: "Financial Confidence",
    confidenceBillsCovered: "Bills covered",
    confidenceSavingsOnTrack: "Savings on track",
    confidenceSpendingWithinBudget: "Spending within budget",
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
    webUnsupportedNote: "Check-ins arrive as notifications, which need the iOS or Android app.",
    permissionDeniedNote: "Notifications are off for Checkpoint — enable them in your device settings first.",
  },

  bigPurchaseMode: {
    cardTitle: "Big Purchase Mode",
    cardSubtitle: "Above a threshold you set, Decision Mode adds a few extra questions worth sitting with.",
    toggleLabel: "Big Purchase Mode",
    thresholdLabel: "Threshold",
  },

  places: {
    title: "Places to watch",
    subtitle:
      "Mark a spot — a mall, your usual coffee shop — and Checkpoint offers a quiet check-in when you're nearby. Never a lecture, never automatic.",
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
      "Location access is off for Checkpoint — enable \"Allow all the time\" in your device settings to use this.",
    backgroundNote:
      "Checking for nearby places uses your location in the background, and shows a persistent notification while it's on — that's an Android requirement, not a Checkpoint choice.",
    arrivalNotificationTitle: (place: string) => `You're near ${place}`,
    arrivalNotificationBody: "Want to Checkpoint before you shop today?",
  },

  spendingWall: {
    title: "Checkpoint",
    prompt: "Decision Mode",
    question: "Is this worth it, right now?",
    safeToSpendLabel: "Safe to Spend",
    futureYouNote: (amount: string) =>
      `Future You will have ${amount} less set aside.`,
    pauseHint: "Take a breath. This screen won't rush you.",
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
    skipCta: "Skip",
    confirmCta: "Done",
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
    subtitle: "A cushion, a trip, a new place — whatever it is, Checkpoint will give you a heads-up before a purchase dips into it.",
    namePlaceholder: "What are you working toward? (e.g. Cushion, Trip, New car)",
    amountPlaceholder: "$ target amount",
    skipCta: "Skip for now",
  },

  onboardingResponsibilities: {
    title: "What's already spoken for?",
    subtitle: "Rent, a phone bill, anything that leaves your account the same way every month. One's enough to start — add more anytime.",
  },

  onboardingHabits: {
    title: "What's a spending habit you have?",
    subtitle: "Coffee, eating out, something you buy often. Checkpoint uses this to notice patterns, not to judge them.",
  },

  futureVisionStep: {
    title: "What does financial freedom look like to you?",
    subtitle: "A short phrase is plenty — Checkpoint will bring it back up at the moments it actually matters.",
    placeholder: "e.g. Buying my first house, Never worrying about bills",
    saveCta: "Save",
    skipCta: "Skip for now",
    editCta: "Edit",
  },

  decisionsScreen: {
    title: "Decisions",
    subtitle: "Every Checkpoint, and how it went.",
    empty: "No decisions yet — they'll show up here after your first Checkpoint.",
    moneyProtectedLabel: (amount: string) => `${amount} protected by pausing or reconsidering`,
    topReasonLabel: (reason: string) => `Most common reason: "${reason}"`,
    exportCta: "Export history",
    exportingLabel: "Preparing export…",
    exportUnsupported: "Exporting isn't available on this device.",
    exportError: "That didn't go through. Try again.",
  },

  outcomeLabel: {
    continued: "Continued",
    paused: "Paused",
    reconsidered: "Reconsidered",
  } as const,

  auth: {
    signInTitle: "Welcome back",
    signInSubtitle: "Continue to your Checkpoint.",
    signUpTitle: "Start your Checkpoint",
    signUpSubtitle: "A calmer way to see your money.",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Password",
    signInCta: "Continue",
    signUpCta: "Create account",
    switchToSignUp: "New here? Create an account",
    switchToSignIn: "Already have an account? Sign in",
  },

  linkAccount: {
    title: "Connect your bank",
    subtitle:
      "Checkpoint reads your balances and recent activity — it can't move money. Your login stays with your bank.",
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
