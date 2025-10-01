const CLIENT_PROFILES = [
  {
    id: 'willrise_startup',
    displayName: 'WillRise Safety (Startup)',
    vertical: 'physical-ecom',
    stage: 'startup',
    founderPersona: 'Compliance-focused engineer launching safety harness line',
    consultantFocus: ['Credibility', 'Regulatory clarity', 'Budget control'],
    agentFocus: ['Rapid platform provisioning', 'Template-based automation'],
    automationAcceptance: 5,
    humanTouchPreference: 8,
    primaryGoals: ['Build trust with B2B buyers', 'Showcase safety certifications', 'Establish professional presence'],
    painPoints: ['Limited marketing budget', 'Needs OSHA-compliant messaging', 'Skeptical buyers'],
    baselineBudget: 12000,
    targetTimelineDays: 45
  },
  {
    id: 'willrise_growing',
    displayName: 'WillRise Safety (Growing)',
    vertical: 'physical-ecom',
    stage: 'growing',
    founderPersona: 'Operations director scaling distribution channels',
    consultantFocus: ['Channel consistency', 'Sales enablement', 'Team onboarding'],
    agentFocus: ['Workflow automation', 'Inventory-linked content'],
    automationAcceptance: 6,
    humanTouchPreference: 7,
    primaryGoals: ['Sync pricing across channels', 'Train sales reps', 'Maintain compliance'],
    painPoints: ['Inventory sync issues', 'Team fragmented tooling', 'Manual compliance reviews'],
    baselineBudget: 48000,
    targetTimelineDays: 75
  },
  {
    id: 'willrise_scaling',
    displayName: 'WillRise Safety (Scaling)',
    vertical: 'physical-ecom',
    stage: 'scaling',
    founderPersona: 'VP Growth expanding into EU markets',
    consultantFocus: ['International readiness', 'Compliance localization', 'Enterprise reporting'],
    agentFocus: ['Localized workflows', 'Credential vaulting'],
    automationAcceptance: 7,
    humanTouchPreference: 6,
    primaryGoals: ['Launch multilingual sites', 'Track CE compliance', 'Maintain B2B pipelines'],
    painPoints: ['Regional regulation complexity', 'Translation QA', 'Long enterprise cycles'],
    baselineBudget: 180000,
    targetTimelineDays: 120
  },
  {
    id: 'decentral_startup',
    displayName: 'DecentralDAO (Startup)',
    vertical: 'dao-project',
    stage: 'startup',
    founderPersona: 'Crypto-native builder launching governance token',
    consultantFocus: ['Clarity of governance model', 'Community safety rails'],
    agentFocus: ['Token-gated infrastructure', 'Education content automation'],
    automationAcceptance: 9,
    humanTouchPreference: 4,
    primaryGoals: ['Bootstrap governance community', 'Educate on tokenomics', 'Launch Discord + Snapshot'],
    painPoints: ['Regulatory ambiguity', 'Fragmented community tools', 'Need fast launch'],
    baselineBudget: 28000,
    targetTimelineDays: 30
  },
  {
    id: 'decentral_growing',
    displayName: 'DecentralDAO (Growing)',
    vertical: 'dao-project',
    stage: 'growing',
    founderPersona: 'Protocol lead managing active DAO',
    consultantFocus: ['Participation health', 'Treasury transparency', 'Delegation'],
    agentFocus: ['Governance analytics', 'Proposal routing automations'],
    automationAcceptance: 9,
    humanTouchPreference: 5,
    primaryGoals: ['Lift proposal quality', 'Increase delegate engagement', 'Automate analytics'],
    painPoints: ['Low voter turnout', 'Proposal overload', 'Manual report creation'],
    baselineBudget: 96000,
    targetTimelineDays: 60
  },
  {
    id: 'decentral_scaling',
    displayName: 'DecentralDAO (Scaling)',
    vertical: 'dao-project',
    stage: 'scaling',
    founderPersona: 'Ecosystem steward coordinating multi-chain DAO',
    consultantFocus: ['Risk controls', 'Cross-chain compliance', 'Partner integrations'],
    agentFocus: ['Automation guardrails', 'Multi-chain orchestration'],
    automationAcceptance: 8,
    humanTouchPreference: 6,
    primaryGoals: ['Standardize governance tooling', 'Support multi-chain ops', 'Run security playbooks'],
    painPoints: ['Cross-chain coordination', 'Security approvals', 'Partner SLA tracking'],
    baselineBudget: 210000,
    targetTimelineDays: 150
  },
  {
    id: 'questmaster_startup',
    displayName: 'QuestMaster Games (Startup)',
    vertical: 'hybrid-gaming',
    stage: 'startup',
    founderPersona: 'Indie designer launching hybrid board/digital game',
    consultantFocus: ['Community building', 'Launch sequencing', 'Storytelling'],
    agentFocus: ['Crowdfunding content automation', 'Social video kits'],
    automationAcceptance: 7,
    humanTouchPreference: 7,
    primaryGoals: ['Kickstarter success', 'App store readiness', 'Build ambassador community'],
    painPoints: ['Resource constraints', 'Need cross-channel storytelling', 'Playtesting logistics'],
    baselineBudget: 22000,
    targetTimelineDays: 50
  },
  {
    id: 'questmaster_growing',
    displayName: 'QuestMaster Games (Growing)',
    vertical: 'hybrid-gaming',
    stage: 'growing',
    founderPersona: 'Live ops lead scaling post-launch engagement',
    consultantFocus: ['Retention loops', 'Event cadence', 'Monetization signals'],
    agentFocus: ['Event automation', 'Player analytics surfacing'],
    automationAcceptance: 8,
    humanTouchPreference: 6,
    primaryGoals: ['Increase retention', 'Launch seasonal content', 'Measure player spend'],
    painPoints: ['Fragmented community platforms', 'Manual event setup', 'Limited analytics insights'],
    baselineBudget: 76000,
    targetTimelineDays: 70
  },
  {
    id: 'questmaster_scaling',
    displayName: 'QuestMaster Games (Scaling)',
    vertical: 'hybrid-gaming',
    stage: 'scaling',
    founderPersona: 'COO driving franchise expansion',
    consultantFocus: ['Global launch strategy', 'Partnership activations', 'Data governance'],
    agentFocus: ['Regional campaign automation', 'Advanced analytics ops'],
    automationAcceptance: 7,
    humanTouchPreference: 6,
    primaryGoals: ['Expand retail partnerships', 'Unify analytics', 'Launch co-branded events'],
    painPoints: ['Regional compliance', 'Campaign localization', 'Data silos'],
    baselineBudget: 185000,
    targetTimelineDays: 140
  }
];

const SCENARIO_TEMPLATES = {
  willrise_startup: [
    {
      id: 'compliance_brand_presence',
      label: 'Compliance-first Brand Presence',
      founderPrompt: 'We must launch with OSHA-compliant messaging and look credible to enterprise buyers.',
      baselinePlatforms: ['LinkedIn', 'Google My Business', 'YouTube'],
      baselineTasks: ['Publish compliance microsite', 'Script certification video series', 'Draft OSHA-aligned social copy'],
      complexity: 0.45,
      complianceRisk: 0.7
    },
    {
      id: 'field-demo_capture',
      label: 'Field Demo Capture',
      founderPrompt: 'I want site supervisors to see our harnesses in action within a week.',
      baselinePlatforms: ['YouTube', 'Vimeo', 'Dropbox Showcase'],
      baselineTasks: ['Storyboard on-site demo', 'Capture testimonial footage', 'Publish gated asset library'],
      complexity: 0.52,
      complianceRisk: 0.6
    },
    {
      id: 'trusted_partner_sequence',
      label: 'Trusted Partner Sequencing',
      founderPrompt: 'We need an outreach sequence that highlights safety stats and partnerships.',
      baselinePlatforms: ['HubSpot', 'LinkedIn', 'Mailchimp'],
      baselineTasks: ['Draft safety stat sheet', 'Automate LinkedIn outreach', 'Build trust-nurture email series'],
      complexity: 0.48,
      complianceRisk: 0.65
    }
  ],
  willrise_growing: [
    {
      id: 'channel_synchronization',
      label: 'Channel Synchronization Initiative',
      founderPrompt: 'Our Amazon listings are out of sync with our distributor portal — we need alignment fast.',
      baselinePlatforms: ['Amazon Seller Central', 'Shopify Plus', 'Distributor Portal'],
      baselineTasks: ['Audit listing discrepancies', 'Sync pricing automations', 'Launch distributor update workflow'],
      complexity: 0.62,
      complianceRisk: 0.6
    },
    {
      id: 'sales_enablement_playbook',
      label: 'Sales Enablement Playbook',
      founderPrompt: 'The reps need a repeatable playbook that references our safety credentials.',
      baselinePlatforms: ['Guru', 'Salesforce', 'Notion'],
      baselineTasks: ['Compile compliance playbook', 'Automate credential refresh', 'Train reps on escalation protocol'],
      complexity: 0.58,
      complianceRisk: 0.55
    }
  ],
  willrise_scaling: [
    {
      id: 'eu_market_entry',
      label: 'EU Market Entry',
      founderPrompt: 'Prepare localized sites and ensure CE documentation before the Hannover Messe conference.',
      baselinePlatforms: ['Localized CMS', 'Partner Portal', 'Compliance Tracker'],
      baselineTasks: ['Localize product catalog', 'Stand-up CE documentation workflow', 'Enable partner credentialing hub'],
      complexity: 0.78,
      complianceRisk: 0.82
    },
    {
      id: 'enterprise_pipeline_visibility',
      label: 'Enterprise Pipeline Visibility',
      founderPrompt: 'We need visibility across enterprise deals and compliance milestones.',
      baselinePlatforms: ['Salesforce Enterprise', 'Power BI', 'Compliance Vault'],
      baselineTasks: ['Define compliance stages', 'Build exec dashboard', 'Automate risk alerts'],
      complexity: 0.74,
      complianceRisk: 0.75
    }
  ],
  decentral_startup: [
    {
      id: 'discord_governance_launch',
      label: 'Discord Governance Launch',
      founderPrompt: 'We’re two weeks from launch — community needs token-gated channels and proposal flow.',
      baselinePlatforms: ['Discord', 'Snapshot', 'Guild.xyz'],
      baselineTasks: ['Configure gated channels', 'Deploy proposal templates', 'Automate onboarding quests'],
      complexity: 0.43,
      complianceRisk: 0.4
    },
    {
      id: 'tokenomics_education',
      label: 'Tokenomics Education Sprint',
      founderPrompt: 'People are confused about our emission schedule — we need education assets immediately.',
      baselinePlatforms: ['Mirror', 'Twitter', 'Notion'],
      baselineTasks: ['Draft tokenomics explainer', 'Schedule AMAs', 'Publish treasury transparency dashboard'],
      complexity: 0.47,
      complianceRisk: 0.45
    }
  ],
  decentral_growing: [
    {
      id: 'delegation_program',
      label: 'Delegation Program Lift',
      founderPrompt: 'Delegates are overwhelmed — we need filtering and rotation support.',
      baselinePlatforms: ['Tally', 'Snapshot', 'Discord'],
      baselineTasks: ['Define proposal intake filters', 'Launch delegate rotation automation', 'Publish delegate health report'],
      complexity: 0.64,
      complianceRisk: 0.5
    },
    {
      id: 'treasury_reporting',
      label: 'Treasury Reporting Automation',
      founderPrompt: 'Investors expect quarterly dashboards that tie on/off-chain assets together.',
      baselinePlatforms: ['Dune Analytics', 'Google Sheets', 'Discourse'],
      baselineTasks: ['Aggregate treasury data', 'Automate quarterly report template', 'Publish investor summary workflow'],
      complexity: 0.68,
      complianceRisk: 0.55
    }
  ],
  decentral_scaling: [
    {
      id: 'multichain_security_review',
      label: 'Multi-chain Security Review',
      founderPrompt: 'We’re deploying to three chains and need coordinated security approvals.',
      baselinePlatforms: ['Halborn', 'Notifi', 'On-chain monitor'],
      baselineTasks: ['Schedule security review workflow', 'Automate incident paging', 'Create approval matrix'],
      complexity: 0.82,
      complianceRisk: 0.78
    },
    {
      id: 'partner_program_ops',
      label: 'Partner Program Ops',
      founderPrompt: 'Exchanges want standardized partner kits and SLAs tracked in real time.',
      baselinePlatforms: ['Partner Portal', 'Zendesk', 'CRM'],
      baselineTasks: ['Build partner onboarding flow', 'Automate SLA tracking', 'Roll out escalation playbooks'],
      complexity: 0.76,
      complianceRisk: 0.65
    }
  ],
  questmaster_startup: [
    {
      id: 'dual_launch_coordination',
      label: 'Dual Launch Coordination',
      founderPrompt: 'Kickstarter and the companion app must tell the same story on day one.',
      baselinePlatforms: ['Kickstarter', 'App Store Connect', 'Discord'],
      baselineTasks: ['Craft unified launch narrative', 'Automate backer updates', 'Set up playtester feedback loop'],
      complexity: 0.5,
      complianceRisk: 0.35
    },
    {
      id: 'ambassador_program',
      label: 'Ambassador Program Setup',
      founderPrompt: 'We want superfans to host local events and share gameplay videos.',
      baselinePlatforms: ['Facebook Groups', 'TikTok', 'Notion'],
      baselineTasks: ['Recruit ambassador cohort', 'Provide content kit', 'Launch event reporting workflow'],
      complexity: 0.48,
      complianceRisk: 0.32
    }
  ],
  questmaster_growing: [
    {
      id: 'live_ops_calendar',
      label: 'Live Ops Calendar Build',
      founderPrompt: 'We need a seasonal content engine across mobile, Discord, and retail displays.',
      baselinePlatforms: ['Monday.com', 'Discord', 'Mailchimp'],
      baselineTasks: ['Map seasonal beats', 'Automate push notification campaigns', 'Coordinate retail assets'],
      complexity: 0.63,
      complianceRisk: 0.4
    },
    {
      id: 'player_retention_suite',
      label: 'Player Retention Suite',
      founderPrompt: 'Churn is climbing — build retention automations tied to player behavior.',
      baselinePlatforms: ['Segment', 'Braze', 'Discord'],
      baselineTasks: ['Instrument churn signals', 'Launch win-back journey', 'Publish retention analytics dashboard'],
      complexity: 0.67,
      complianceRisk: 0.45
    }
  ],
  questmaster_scaling: [
    {
      id: 'global_campaign_localization',
      label: 'Global Campaign Localization',
      founderPrompt: 'Regional partners need localized assets and reporting.',
      baselinePlatforms: ['Contentful', 'Power BI', 'Regional Social Channels'],
      baselineTasks: ['Localize campaign kits', 'Automate partner reporting', 'Establish governance workflows'],
      complexity: 0.76,
      complianceRisk: 0.58
    },
    {
      id: 'franchise_data_unification',
      label: 'Franchise Data Unification',
      founderPrompt: 'We must unify retail sales, digital engagement, and player feedback.',
      baselinePlatforms: ['Snowflake', 'Amplitude', 'Salesforce'],
      baselineTasks: ['Integrate data sources', 'Publish exec dashboard', 'Define alerting playbooks'],
      complexity: 0.79,
      complianceRisk: 0.6
    }
  ]
};

const VARIATION_TYPES = ['standard', 'budget_constrained', 'time_pressured', 'feature_focused'];

module.exports = {
  CLIENT_PROFILES,
  SCENARIO_TEMPLATES,
  VARIATION_TYPES
};
