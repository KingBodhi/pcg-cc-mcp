import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NoraAssistant, NoraCoordinationPanel, NoraVoiceControls } from '@/components/nora';
import { Crown, Users, Mic, Settings, MessageSquare, Activity } from 'lucide-react';

export function NoraPage() {
  const [activeTab, setActiveTab] = useState('assistant');

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Crown className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Nora Executive Assistant
              </h1>
              <p className="text-sm text-gray-600">
                Your AI-powered Executive Assistant and COO for organizational coordination
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-sm font-medium text-green-600">Active</div>
              <div className="text-xs text-gray-500">British Executive Mode</div>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="assistant" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat Assistant
            </TabsTrigger>
            <TabsTrigger value="coordination" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Coordination
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Voice Settings
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assistant" className="h-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
              {/* Main Chat Interface */}
              <div className="lg:col-span-2">
                <NoraAssistant className="h-full" />
              </div>

              {/* Side Panel - Quick Actions & Context */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Executive Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Crown className="w-4 h-4 mr-2" />
                      Strategic Planning Session
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      Team Performance Review
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Activity className="w-4 h-4 mr-2" />
                      Project Status Update
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="w-4 h-4 mr-2" />
                      Resource Allocation
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Executive Context</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <div className="font-medium text-gray-700">Current Focus</div>
                      <div className="text-gray-600">PowerClub Global coordination and strategic oversight</div>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium text-gray-700">Active Projects</div>
                      <div className="text-gray-600">PCG Dashboard, Multi-agent coordination</div>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium text-gray-700">Priority Level</div>
                      <div className="text-purple-600 font-medium">Executive</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="coordination" className="h-full">
            <NoraCoordinationPanel className="h-full" />
          </TabsContent>

          <TabsContent value="voice" className="h-full">
            <div className="max-w-4xl">
              <NoraVoiceControls />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Interaction Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Interactions</span>
                      <span className="font-medium">1,247</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Voice Interactions</span>
                      <span className="font-medium">432</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Executive Decisions</span>
                      <span className="font-medium">89</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Task Coordinations</span>
                      <span className="font-medium">156</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    Team Coordination
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Agents</span>
                      <span className="font-medium">8</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Successful Handoffs</span>
                      <span className="font-medium">234</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Conflicts Resolved</span>
                      <span className="font-medium">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Approvals Processed</span>
                      <span className="font-medium">67</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-purple-600" />
                    Executive Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Response Accuracy</span>
                      <span className="font-medium text-green-600">96.7%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg Response Time</span>
                      <span className="font-medium">1.2s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">User Satisfaction</span>
                      <span className="font-medium text-green-600">4.8/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Uptime</span>
                      <span className="font-medium text-green-600">99.9%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Recent Executive Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        time: '14:32',
                        action: 'Strategic Planning Session',
                        description: 'Coordinated quarterly planning with development team',
                        status: 'completed'
                      },
                      {
                        time: '13:45',
                        action: 'Resource Allocation',
                        description: 'Optimized resource distribution across active projects',
                        status: 'completed'
                      },
                      {
                        time: '12:20',
                        action: 'Conflict Resolution',
                        description: 'Resolved priority conflict between PCG Dashboard and voice integration',
                        status: 'completed'
                      },
                      {
                        time: '11:15',
                        action: 'Performance Analysis',
                        description: 'Generated team performance insights for management review',
                        status: 'completed'
                      }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-mono text-gray-600">{item.time}</div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.action}</div>
                          <div className="text-xs text-gray-600">{item.description}</div>
                        </div>
                        <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {item.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
