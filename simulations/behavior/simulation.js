const { randomUUID } = require('crypto');
const {
  CLIENT_PROFILES,
  SCENARIO_TEMPLATES,
  VARIATION_TYPES
} = require('./data');

const DEFAULT_RUNS_PER_PROFILE = 100;
const INTERACTION_RANGE = { min: 9, max: 14 };

class BehaviorSimulation {
  constructor(options = {}) {
    this.runsPerProfile = options.runsPerProfile || DEFAULT_RUNS_PER_PROFILE;
    this.random = options.random || Math.random;
    this.results = [];
  }

  runAllProfiles() {
    this.results = [];
    CLIENT_PROFILES.forEach((profile) => {
      const profileResults = this.runProfile(profile);
      this.results.push(...profileResults);
    });

    const analytics = this.buildAnalytics(this.results);
    return {
      results: this.results,
      analytics
    };
  }

  runProfile(profile) {
    const templates = SCENARIO_TEMPLATES[profile.id];
    if (!templates || templates.length === 0) {
      throw new Error(`No scenario templates defined for profile ${profile.id}`);
    }

    const profileResults = [];
    for (let i = 0; i < this.runsPerProfile; i += 1) {
      const baseScenario = templates[i % templates.length];
      const variationType = VARIATION_TYPES[i % VARIATION_TYPES.length];
      const scenario = this.createScenarioVariation(baseScenario, variationType, profile, i);
      const tasks = this.generateTasks(profile, scenario);
      const approvals = this.generateApprovals(profile, scenario, tasks);
      const interactions = this.generateInteractions(profile, scenario, tasks, approvals);
      const metrics = this.deriveMetrics(profile, scenario, tasks, approvals, interactions);

      profileResults.push({
        id: randomUUID(),
        profileId: profile.id,
        profileSummary: {
          displayName: profile.displayName,
          stage: profile.stage,
          vertical: profile.vertical,
          automationAcceptance: profile.automationAcceptance,
          humanTouchPreference: profile.humanTouchPreference
        },
        scenario,
        tasks,
        approvals,
        interactions,
        metrics
      });
    }

    return profileResults;
  }

  createScenarioVariation(baseScenario, variationType, profile, iteration) {
    const variationLabel = {
      standard: 'Standard Conditions',
      budget_constrained: 'Budget-Constrained Adjustment',
      time_pressured: 'Time-Pressured Escalation',
      feature_focused: 'Feature-Focused Upgrade'
    }[variationType];

    const context = {
      variation: variationType,
      label: variationLabel,
      consultantNotes: [],
      agentNotes: []
    };

    const scenario = {
      templateId: baseScenario.id,
      label: baseScenario.label,
      founderPrompt: baseScenario.founderPrompt,
      baselinePlatforms: baseScenario.baselinePlatforms,
      baselineTasks: baseScenario.baselineTasks,
      complexity: baseScenario.complexity,
      complianceRisk: baseScenario.complianceRisk,
      variation: context,
      iterationIndex: iteration
    };

    switch (variationType) {
      case 'budget_constrained':
        context.consultantNotes.push('Reprioritize deliverables for reduced spend.');
        context.agentNotes.push('Swap premium integrations for template-based automations.');
        scenario.adjustedBudget = Math.round(profile.baselineBudget * 0.65);
        scenario.deadlineDays = Math.max(14, Math.round(profile.targetTimelineDays * 1.1));
        scenario.automationBias = Math.max(0, profile.automationAcceptance - 1);
        break;
      case 'time_pressured':
        context.consultantNotes.push('Condense milestones and remove nice-to-have deliverables.');
        context.agentNotes.push('Enable parallel task execution and increase automation coverage.');
        scenario.adjustedBudget = Math.round(profile.baselineBudget * 1.1);
        scenario.deadlineDays = Math.max(7, Math.round(profile.targetTimelineDays * 0.55));
        scenario.automationBias = Math.min(10, profile.automationAcceptance + 1.5);
        break;
      case 'feature_focused':
        context.consultantNotes.push('Expand scope to include analytics and personalization backlog.');
        context.agentNotes.push('Plan phased delivery with advanced feature toggles.');
        scenario.adjustedBudget = Math.round(profile.baselineBudget * 1.35);
        scenario.deadlineDays = Math.round(profile.targetTimelineDays * 1.2);
        scenario.automationBias = Math.min(10, profile.automationAcceptance + 2);
        scenario.featureBacklog = this.generateFeatureBacklog(baseScenario, profile);
        break;
      default:
        scenario.adjustedBudget = profile.baselineBudget;
        scenario.deadlineDays = profile.targetTimelineDays;
        scenario.automationBias = profile.automationAcceptance;
    }

    return scenario;
  }

  generateFeatureBacklog(baseScenario, profile) {
    const featureIdeas = {
      'physical-ecom': ['Inventory-aware personalization', 'Compliance certificate vault', 'Predictive reorder alerts'],
      'dao-project': ['On-chain sentiment feed', 'Delegate reputation scoring', 'Incident response runbooks'],
      'hybrid-gaming': ['Dynamic live ops tuning', 'Player cohort experimentation suite', 'Retail-to-digital conversion tracking']
    };

    const verticalIdeas = featureIdeas[profile.vertical] || [];
    return verticalIdeas.slice(0, 2).map((name, index) => ({
      id: `${baseScenario.id}_feature_${index + 1}`,
      name,
      rationale: `Elevates differentiator for ${profile.displayName}`,
      estimatedEffortPoints: 13 + index * 5
    }));
  }

  generateTasks(profile, scenario) {
    const baseTasks = scenario.baselineTasks;
    const taskCountModifier = scenario.variation.variation === 'time_pressured' ? 0 : 2;
    const totalTasks = baseTasks.length + taskCountModifier;

    const priorities = ['low', 'medium', 'high', 'critical'];

    const tasks = [];
    for (let idx = 0; idx < totalTasks; idx += 1) {
      const baseTitle = baseTasks[idx % baseTasks.length];
      const priorityIndex = Math.min(priorities.length - 1, Math.floor(idx / 2));
      const requiresApproval = this.shouldRequireApproval(profile, scenario, idx);

      tasks.push({
        id: randomUUID(),
        title: baseTitle,
        description: this.expandTaskDescription(baseTitle, scenario, requiresApproval),
        priority: priorities[priorityIndex],
        status: 'pending',
        requiresApproval,
        estimatedHours: this.estimateTaskHours(scenario, idx),
        automationCandidate: this.isAutomationCandidate(profile, scenario, baseTitle),
        relatedPlatforms: this.pickRelatedPlatforms(scenario.baselinePlatforms),
        dependsOn: idx === 0 ? [] : [tasks[idx - 1].id]
      });
    }

    return tasks;
  }

  shouldRequireApproval(profile, scenario, index) {
    const complianceThreshold = (profile.humanTouchPreference + scenario.complianceRisk * 10) / 2;
    const baseChance = complianceThreshold / 10;
    const variationBoost = scenario.variation.variation === 'feature_focused' ? 0.1 : 0;
    const randomFactor = this.random() * 0.6;
    return randomFactor + variationBoost + index * 0.05 > baseChance;
  }

  expandTaskDescription(title, scenario, requiresApproval) {
    const requirement = requiresApproval ? 'Requires consultant approval due to compliance or strategic impact.' : 'Auto-executable via agent workflow once prerequisites are met.';
    return `${title}. ${requirement} Scenario focus: ${scenario.label}.`;
  }

  estimateTaskHours(scenario, idx) {
    const base = 4 + idx * 1.5;
    const complexityFactor = 1 + scenario.complexity * 0.6;
    return Number((base * complexityFactor).toFixed(1));
  }

  isAutomationCandidate(profile, scenario, title) {
    const automationBias = scenario.automationBias ?? profile.automationAcceptance;
    const compliancePenalty = scenario.complianceRisk * 3;
    const threshold = Math.max(0, automationBias - compliancePenalty);
    return threshold >= 5 && !/approval|review|audit/i.test(title);
  }

  pickRelatedPlatforms(platforms) {
    const copies = [...platforms];
    if (copies.length <= 2) {
      return copies;
    }
    copies.sort(() => this.random() - 0.5);
    return copies.slice(0, Math.max(2, Math.floor(this.random() * copies.length)));
  }

  generateApprovals(profile, scenario, tasks) {
    return tasks
      .filter((task) => task.requiresApproval)
      .map((task) => ({
        id: randomUUID(),
        taskId: task.id,
        stage: this.pickApprovalStage(profile, scenario),
        status: 'pending',
        requestedBy: 'Consultant',
        approvers: this.defineApprovers(profile),
        slaHours: this.estimateApprovalSla(profile, scenario),
        reason: this.buildApprovalReason(task, scenario)
      }));
  }

  pickApprovalStage(profile, scenario) {
    if (profile.vertical === 'physical-ecom') {
      return scenario.complianceRisk > 0.7 ? 'Regulatory' : 'Brand';
    }
    if (profile.vertical === 'dao-project') {
      return scenario.complexity > 0.6 ? 'Security' : 'Governance';
    }
    return scenario.complexity > 0.7 ? 'Executive Review' : 'Content QA';
  }

  defineApprovers(profile) {
    if (profile.vertical === 'dao-project') {
      return ['PCG Consultant', 'Governance Specialist'];
    }
    if (profile.vertical === 'physical-ecom') {
      return ['PCG Consultant', 'Compliance Officer'];
    }
    return ['PCG Consultant', 'Brand Producer'];
  }

  estimateApprovalSla(profile, scenario) {
    const base = profile.stage === 'startup' ? 12 : profile.stage === 'growing' ? 18 : 30;
    const complexityImpact = scenario.complexity * 10;
    return Math.round(base + complexityImpact);
  }

  buildApprovalReason(task, scenario) {
    return `Task "${task.title}" flagged due to ${scenario.label.toLowerCase()} considerations.`;
  }

  generateInteractions(profile, scenario, tasks, approvals) {
    const interactionCount = this.randomInt(INTERACTION_RANGE.min, INTERACTION_RANGE.max);
    const interactions = [];

    const roleSequence = [
      { role: 'PCG Consultant', intent: 'discovery' },
      { role: 'Founder', intent: 'need_articulation' },
      { role: 'Automation Agent', intent: 'diagnose' },
      { role: 'Dashboard', intent: 'task_intake' },
      { role: 'PCG Consultant', intent: 'clarify' },
      { role: 'Automation Agent', intent: 'solution_alignment' },
      { role: 'Dashboard', intent: 'approval_routing' },
      { role: 'Founder', intent: 'confirmation' }
    ];

    const interactionTemplates = this.getInteractionTemplates(profile, scenario, tasks, approvals);

    for (let i = 0; i < interactionCount; i += 1) {
      const template = interactionTemplates[i % interactionTemplates.length];
      const role = roleSequence[i % roleSequence.length];
      interactions.push({
        id: randomUUID(),
        order: i + 1,
        speaker: role.role,
        intent: role.intent,
        summary: template.summary,
        detail: template.detail,
        references: template.references,
        sentiment: template.sentiment,
        automationSignal: template.automationSignal,
        followUpRequired: template.followUpRequired
      });
    }

    return interactions;
  }

  getInteractionTemplates(profile, scenario, tasks, approvals) {
    const primaryTask = tasks[0];
    const approvalSummary = approvals.length
      ? `Align on ${approvals.length} pending approval${approvals.length > 1 ? 's' : ''}.`
      : 'No approvals required; automation can proceed after confirmation.';

    const base = [
      {
        summary: scenario.founderPrompt,
        detail: `Founder contextualizes need: ${scenario.founderPrompt}`,
        references: ['Discovery Intake'],
        sentiment: 'urgent',
        automationSignal: false,
        followUpRequired: true
      },
      {
        summary: `Consultant reframes priority around ${scenario.label}.`,
        detail: `Consultant notes emphasize ${scenario.variation.label} with focus on ${scenario.baselinePlatforms.join(', ')}.`,
        references: ['Consultant Notes'],
        sentiment: 'focused',
        automationSignal: false,
        followUpRequired: false
      },
      {
        summary: `Automation agent proposes kickoff task: ${primaryTask.title}.`,
        detail: primaryTask.description,
        references: ['Automation Plan'],
        sentiment: 'confident',
        automationSignal: primaryTask.automationCandidate,
        followUpRequired: !primaryTask.automationCandidate
      },
      {
        summary: 'Dashboard schedules workflow and captures ownership.',
        detail: 'Dashboard creates automation workflow template and assigns initial owners.',
        references: ['Dashboard Scheduling'],
        sentiment: 'neutral',
        automationSignal: true,
        followUpRequired: false
      },
      {
        summary: approvalSummary,
        detail: approvals.length ? `Approvals needed for: ${approvals.map((item) => item.stage).join(', ')}.` : 'Automation flagged no manual approvals.',
        references: ['Approval Center'],
        sentiment: approvals.length ? 'cautious' : 'positive',
        automationSignal: approvals.length === 0,
        followUpRequired: approvals.length > 0
      },
      {
        summary: 'Consultant confirms success metrics and deadlines.',
        detail: `Targets set for ${scenario.deadlineDays} day window with budget ${scenario.adjustedBudget}.`,
        references: ['Engagement Brief'],
        sentiment: 'positive',
        automationSignal: false,
        followUpRequired: false
      },
      {
        summary: 'Automation agent sequences follow-on tasks.',
        detail: `Outlined ${tasks.length} tasks with phased automation readiness checks.`,
        references: ['Automation Roadmap'],
        sentiment: 'confident',
        automationSignal: true,
        followUpRequired: false
      },
      {
        summary: 'Founder signs off and requests progress snapshots.',
        detail: 'Founder requests weekly dashboards and risk alerts.',
        references: ['Client Success Log'],
        sentiment: 'satisfied',
        automationSignal: false,
        followUpRequired: true
      }
    ];

    return base;
  }

  deriveMetrics(profile, scenario, tasks, approvals, interactions) {
    const automationEligible = tasks.filter((task) => task.automationCandidate).length;
    const approvalCount = approvals.length;
    const interactionScore = this.calculateInteractionScore(interactions);
    const satisfaction = this.calculateSatisfaction(profile, scenario, interactions, approvalCount);
    const projectedDurationDays = this.calculateProjectedDuration(tasks, approvals, scenario);

    return {
      automationEligibleTasks: automationEligible,
      approvalsRequired: approvalCount,
      interactionScore,
      satisfaction,
      projectedDurationDays,
      estimatedCost: this.estimateCost(profile, scenario, tasks),
      riskLevel: this.calculateRiskLevel(profile, scenario, approvals),
      followUpActions: this.determineFollowUps(tasks, approvals)
    };
  }

  calculateInteractionScore(interactions) {
    const followUps = interactions.filter((item) => item.followUpRequired).length;
    const automationSignals = interactions.filter((item) => item.automationSignal).length;
    return Number((automationSignals * 1.2 - followUps * 0.5 + interactions.length * 0.3).toFixed(2));
  }

  calculateSatisfaction(profile, scenario, interactions, approvalCount) {
    const base = 6.5 + profile.automationAcceptance * 0.2;
    const interactionImpact = interactions.length * 0.05;
    const approvalPenalty = approvalCount * 0.25;
    const timelineImpact = scenario.deadlineDays < profile.targetTimelineDays ? 0.4 : -0.2;
    const sentimentModifier = interactions.filter((i) => i.sentiment === 'urgent').length ? -0.3 : 0.2;
    const score = base + interactionImpact - approvalPenalty + timelineImpact + sentimentModifier;
    return Number(Math.max(1, Math.min(10, score)).toFixed(1));
  }

  calculateProjectedDuration(tasks, approvals, scenario) {
    const taskHours = tasks.reduce((sum, task) => sum + task.estimatedHours, 0);
    const approvalHours = approvals.reduce((sum, approval) => sum + approval.slaHours, 0);
    const automationAcceleration = scenario.automationBias ? scenario.automationBias * 0.04 : 0;
    const totalHours = taskHours + approvalHours * 0.35;
    const days = totalHours / (8 + automationAcceleration);
    return Number(Math.max(5, days).toFixed(1));
  }

  estimateCost(profile, scenario, tasks) {
    const base = scenario.adjustedBudget;
    const automationDiscount = tasks.filter((task) => task.automationCandidate).length * 120;
    const approvalPremium = tasks.filter((task) => task.requiresApproval).length * 180;
    return Math.round(base - automationDiscount + approvalPremium);
  }

  calculateRiskLevel(profile, scenario, approvals) {
    const complianceWeight = scenario.complianceRisk * 4;
    const approvalWeight = approvals.length * 0.5;
    const stageModifier = profile.stage === 'startup' ? 0.5 : profile.stage === 'growing' ? 0.3 : 0.7;
    const raw = complianceWeight + approvalWeight + stageModifier;
    if (raw > 5) return 'high';
    if (raw > 3) return 'medium';
    return 'low';
  }

  determineFollowUps(tasks, approvals) {
    const followUps = [];
    if (approvals.length) {
      followUps.push('Track approval SLAs in dashboard');
    }
    if (tasks.some((task) => !task.automationCandidate)) {
      followUps.push('Schedule human operator checkpoints');
    }
    if (tasks.length > 6) {
      followUps.push('Break tasks into phased releases');
    }
    return followUps;
  }

  buildAnalytics(results) {
    const byProfile = new Map();
    const byVertical = new Map();
    const byStage = new Map();

    results.forEach((result) => {
      this.aggregate(byProfile, result.profileId, result.metrics);
      this.aggregate(byVertical, result.profileSummary.vertical, result.metrics);
      this.aggregate(byStage, result.profileSummary.stage, result.metrics);
    });

    return {
      totals: {
        scenarios: results.length,
        approvals: results.reduce((sum, r) => sum + r.metrics.approvalsRequired, 0),
        automationCandidates: results.reduce((sum, r) => sum + r.metrics.automationEligibleTasks, 0)
      },
      byProfile: this.formatAggregateMap(byProfile),
      byVertical: this.formatAggregateMap(byVertical),
      byStage: this.formatAggregateMap(byStage)
    };
  }

  aggregate(map, key, metrics) {
    const current = map.get(key) || {
      scenarios: 0,
      approvals: 0,
      automationEligibleTasks: 0,
      satisfactionSum: 0,
      durationSum: 0,
      costSum: 0
    };

    current.scenarios += 1;
    current.approvals += metrics.approvalsRequired;
    current.automationEligibleTasks += metrics.automationEligibleTasks;
    current.satisfactionSum += metrics.satisfaction;
    current.durationSum += metrics.projectedDurationDays;
    current.costSum += metrics.estimatedCost;

    map.set(key, current);
  }

  formatAggregateMap(map) {
    const entries = [];
    map.forEach((value, key) => {
      entries.push({
        key,
        scenarios: value.scenarios,
        avgApprovals: Number((value.approvals / value.scenarios).toFixed(2)),
        avgAutomationEligibleTasks: Number((value.automationEligibleTasks / value.scenarios).toFixed(2)),
        avgSatisfaction: Number((value.satisfactionSum / value.scenarios).toFixed(2)),
        avgProjectedDurationDays: Number((value.durationSum / value.scenarios).toFixed(2)),
        avgEstimatedCost: Math.round(value.costSum / value.scenarios)
      });
    });
    return entries.sort((a, b) => a.key.localeCompare(b.key));
  }

  randomInt(min, max) {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }
}

module.exports = {
  BehaviorSimulation
};
