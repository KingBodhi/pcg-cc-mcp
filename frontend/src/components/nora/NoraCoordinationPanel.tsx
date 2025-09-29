import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import {
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Activity,
  AlertCircle,
  TrendingUp,
  Calendar
} from 'lucide-react';

// Type definitions based on Rust backend coordination system
interface CoordinationStats {
  totalAgents: number;
  activeAgents: number;
  pendingApprovals: number;
  activeConflicts: number;
  averageResponseTime: number;
}

interface AgentCoordinationState {
  agentId: string;
  agentType: string;
  status: AgentStatus;
  capabilities: string[];
  currentTasks: string[];
  lastSeen: string;
  performanceMetrics: PerformanceMetrics;
}

interface PerformanceMetrics {
  tasksCompleted: number;
  averageResponseTimeMs: number;
  successRate: number;
  uptimePercentage: number;
}

type AgentStatus = 'Active' | 'Busy' | 'Idle' | 'Offline' | 'Error' | 'Maintenance';

interface CoordinationEvent {
  type: 'AgentStatusUpdate' | 'TaskHandoff' | 'ConflictResolution' | 'ApprovalRequest' | 'ExecutiveAlert';
  timestamp: string;
  data: any;
}

interface NoraCoordinationPanelProps {
  className?: string;
}

export function NoraCoordinationPanel({ className }: NoraCoordinationPanelProps) {
  const [stats, setStats] = useState<CoordinationStats | null>(null);
  const [agents, setAgents] = useState<AgentCoordinationState[]>([]);
  const [events, setEvents] = useState<CoordinationEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  useEffect(() => {
    fetchCoordinationData();
    setupWebSocket();

    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, []);

  const fetchCoordinationData = async () => {
    try {
      setIsLoading(true);

      // Fetch coordination stats
      const statsResponse = await fetch('/api/nora/coordination/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch agent states
      const agentsResponse = await fetch('/api/nora/coordination/agents');
      if (agentsResponse.ok) {
        const agentsData = await agentsResponse.json();
        setAgents(agentsData);
      }
    } catch (error) {
      console.error('Failed to fetch coordination data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/nora/coordination/events`);

    ws.onopen = () => {
      console.log('Coordination WebSocket connected');
      setWsConnection(ws);
    };

    ws.onmessage = (event) => {
      const coordinationEvent: CoordinationEvent = JSON.parse(event.data);
      setEvents(prev => [coordinationEvent, ...prev.slice(0, 49)]); // Keep last 50 events

      // Update agent states if needed
      if (coordinationEvent.type === 'AgentStatusUpdate') {
        fetchCoordinationData(); // Refresh data on agent updates
      }
    };

    ws.onclose = () => {
      console.log('Coordination WebSocket disconnected');
      setWsConnection(null);
      // Attempt to reconnect after 5 seconds
      setTimeout(setupWebSocket, 5000);
    };

    ws.onerror = (error) => {
      console.error('Coordination WebSocket error:', error);
    };
  };

  const getStatusIcon = (status: AgentStatus) => {
    switch (status) {
      case 'Active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Busy': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'Idle': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'Offline': return <AlertCircle className="w-4 h-4 text-gray-500" />;
      case 'Error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'Maintenance': return <Activity className="w-4 h-4 text-orange-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Busy': return 'bg-yellow-100 text-yellow-800';
      case 'Idle': return 'bg-blue-100 text-blue-800';
      case 'Offline': return 'bg-gray-100 text-gray-800';
      case 'Error': return 'bg-red-100 text-red-800';
      case 'Maintenance': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatUptime = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'AgentStatusUpdate': return <Activity className="w-4 h-4 text-blue-500" />;
      case 'TaskHandoff': return <Zap className="w-4 h-4 text-purple-500" />;
      case 'ConflictResolution': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'ApprovalRequest': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'ExecutiveAlert': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader message="Loading coordination data..." size={32} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Coordination Statistics */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Coordination Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalAgents}</div>
                <div className="text-sm text-gray-600">Total Agents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.activeAgents}</div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingApprovals}</div>
                <div className="text-sm text-gray-600">Pending Approvals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.activeConflicts}</div>
                <div className="text-sm text-gray-600">Active Conflicts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatResponseTime(stats.averageResponseTime)}
                </div>
                <div className="text-sm text-gray-600">Avg Response</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Status Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            Agent Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <div key={agent.agentId} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{agent.agentType}</div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(agent.status)}
                    <Badge className={getStatusColor(agent.status)}>
                      {agent.status}
                    </Badge>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <div>ID: {agent.agentId.substring(0, 8)}...</div>
                  <div>Last seen: {new Date(agent.lastSeen).toLocaleTimeString()}</div>
                </div>

                {/* Capabilities */}
                <div>
                  <div className="text-sm font-medium mb-1">Capabilities:</div>
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities.map((capability) => (
                      <Badge key={capability} variant="secondary" className="text-xs">
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-gray-600">Tasks</div>
                    <div className="font-medium">{agent.performanceMetrics.tasksCompleted}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Success Rate</div>
                    <div className="font-medium">{(agent.performanceMetrics.successRate * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Response</div>
                    <div className="font-medium">{formatResponseTime(agent.performanceMetrics.averageResponseTimeMs)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Uptime</div>
                    <div className="font-medium">{formatUptime(agent.performanceMetrics.uptimePercentage)}</div>
                  </div>
                </div>

                {/* Current Tasks */}
                {agent.currentTasks.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-1">Current Tasks:</div>
                    <div className="space-y-1">
                      {agent.currentTasks.slice(0, 3).map((task, index) => (
                        <div key={index} className="text-xs bg-blue-50 px-2 py-1 rounded">
                          {task.length > 30 ? `${task.substring(0, 30)}...` : task}
                        </div>
                      ))}
                      {agent.currentTasks.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{agent.currentTasks.length - 3} more tasks
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Recent Coordination Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                No recent events
              </div>
            ) : (
              events.map((event, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  {getEventIcon(event.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">{event.type}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {typeof event.data === 'object' ?
                        JSON.stringify(event.data).substring(0, 100) + '...' :
                        event.data}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${wsConnection ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">Real-time coordination</span>
            </div>
            <div className="text-sm text-gray-600">
              {wsConnection ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}