#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { BehaviorSimulation } = require('./simulation');
const { CLIENT_PROFILES } = require('./data');

function ensureOutputDir() {
  const outputDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  return outputDir;
}

function printSummary(analytics) {
  console.log('');
  console.log('=== PCG DASHBOARD BEHAVIOR SIMULATION SUMMARY ===');
  console.log(`Total scenarios simulated: ${analytics.totals.scenarios}`);
  console.log(`Total approvals routed: ${analytics.totals.approvals}`);
  console.log(`Automation-eligible tasks: ${analytics.totals.automationCandidates}`);
  console.log('');

  console.log('By Profile:');
  analytics.byProfile.forEach((entry) => {
    const profile = CLIENT_PROFILES.find((p) => p.id === entry.key);
    console.log(`  • ${profile ? profile.displayName : entry.key}`);
    console.log(`    - Scenarios: ${entry.scenarios}`);
    console.log(`    - Avg satisfaction: ${entry.avgSatisfaction}`);
    console.log(`    - Avg projected duration (days): ${entry.avgProjectedDurationDays}`);
    console.log(`    - Avg estimated cost: $${entry.avgEstimatedCost}`);
  });

  console.log('');
  console.log('By Stage:');
  analytics.byStage.forEach((entry) => {
    console.log(`  • ${entry.key}`);
    console.log(`    - Scenarios: ${entry.scenarios}`);
    console.log(`    - Avg approvals: ${entry.avgApprovals}`);
    console.log(`    - Avg automation-ready tasks: ${entry.avgAutomationEligibleTasks}`);
  });

  console.log('');
  console.log('By Vertical:');
  analytics.byVertical.forEach((entry) => {
    console.log(`  • ${entry.key}`);
    console.log(`    - Avg satisfaction: ${entry.avgSatisfaction}`);
    console.log(`    - Avg projected duration (days): ${entry.avgProjectedDurationDays}`);
  });
}

function main() {
  const runsPerProfile = parseInt(process.env.PCG_BEHAVIOR_RUNS || '100', 10);
  if (!Number.isFinite(runsPerProfile) || runsPerProfile <= 0) {
    throw new Error('Invalid runs per profile provided.');
  }

  const simulation = new BehaviorSimulation({ runsPerProfile });
  const { results, analytics } = simulation.runAllProfiles();

  const outputDir = ensureOutputDir();
  const outputPath = path.join(outputDir, 'behavior-simulation.json');

  const payload = {
    generatedAt: new Date().toISOString(),
    runsPerProfile,
    totals: analytics.totals,
    byProfile: analytics.byProfile,
    byStage: analytics.byStage,
    byVertical: analytics.byVertical,
    scenarios: results
  };

  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
  printSummary(analytics);
  console.log('');
  console.log(`Simulation output stored at ${path.relative(process.cwd(), outputPath)}`);
}

main();
