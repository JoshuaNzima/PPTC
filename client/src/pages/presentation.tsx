
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Vote, 
  Shield, 
  Users, 
  BarChart3, 
  FileText, 
  Smartphone, 
  Globe, 
  Database,
  Lock,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  MessageSquare,
  Upload,
  Settings,
  ArrowRight,
  ArrowLeft,
  Play,
  Pause
} from 'lucide-react';

const slides = [
  {
    id: 1,
    title: "Parallel Tally Center (PTC) System",
    subtitle: "Secure Election Management Platform",
    content: (
      <div className="text-center space-y-8">
        <div className="w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center mx-auto">
          <Vote className="text-white h-12 w-12" />
        </div>
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-800">Real-Time Election Monitoring</h3>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A comprehensive platform for collecting, verifying, and monitoring election results 
            with transparency, security, and real-time capabilities.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
          <Badge variant="secondary" className="py-2">Multi-Channel</Badge>
          <Badge variant="secondary" className="py-2">Real-Time</Badge>
          <Badge variant="secondary" className="py-2">Secure</Badge>
        </div>
      </div>
    )
  },
  {
    id: 2,
    title: "System Overview",
    subtitle: "Comprehensive Election Management Solution",
    content: (
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-800">Core Capabilities</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Upload className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold">Result Submission</h4>
                <p className="text-sm text-gray-600">Multi-channel submission via Portal, USSD, WhatsApp, and SMS</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold">Verification System</h4>
                <p className="text-sm text-gray-600">Role-based verification with document validation</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BarChart3 className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold">Real-Time Analytics</h4>
                <p className="text-sm text-gray-600">Live dashboards with WebSocket updates</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold">Complaint Management</h4>
                <p className="text-sm text-gray-600">Structured complaint handling with MEC escalation</p>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-800">Key Features</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium">Multi-Role Access</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <Lock className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium">Secure Authentication</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <Clock className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium">Real-Time Updates</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg text-center">
              <Database className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium">Audit Trail</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 3,
    title: "User Roles & Access Control",
    subtitle: "Role-Based Permission System",
    content: (
      <div className="space-y-8">
        <div className="grid grid-cols-4 gap-6">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-center text-sm">Agent</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-xs space-y-1">
                <li>Submit Results</li>
                <li>Upload Documents</li>
                <li>View Own Submissions</li>
                <li>Submit Complaints</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-center text-sm">Supervisor</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-xs space-y-1">
                <li>Verify Results</li>
                <li>Review Complaints</li>
                <li>Access Analytics</li>
                <li>Manage Escalations</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-center text-sm">Reviewer</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-xs space-y-1">
                <li>Review Flagged Results</li>
                <li>Edit Flagged Data</li>
                <li>Document Analysis</li>
                <li>Quality Control</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-center text-sm">Admin</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-xs space-y-1">
                <li>Full System Access</li>
                <li>User Management</li>
                <li>System Configuration</li>
                <li>Data Management</li>
              </ul>
            </CardContent>
          </Card>
        </div>
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="font-semibold mb-3">Security Features</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Session Management</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Password Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Audit Logging</span>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 4,
    title: "Multi-Channel Result Submission",
    subtitle: "Four Ways to Submit Election Results",
    content: (
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-8">
          <Card className="border-blue-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Globe className="h-8 w-8 text-blue-500" />
                <div>
                  <CardTitle className="text-lg">Web Portal</CardTitle>
                  <p className="text-sm text-gray-600">Desktop & Mobile Browser</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Rich form interface</li>
                <li>• File upload support</li>
                <li>• Real-time validation</li>
                <li>• Responsive design</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Smartphone className="h-8 w-8 text-green-500" />
                <div>
                  <CardTitle className="text-lg">USSD</CardTitle>
                  <p className="text-sm text-gray-600">Any Mobile Phone</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Works on basic phones</li>
                <li>• Step-by-step guidance</li>
                <li>• Offline capability</li>
                <li>• Multiple providers</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-purple-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-purple-500" />
                <div>
                  <CardTitle className="text-lg">WhatsApp</CardTitle>
                  <p className="text-sm text-gray-600">Business API Integration</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Photo submission</li>
                <li>• Chat-based interface</li>
                <li>• Automated responses</li>
                <li>• Wide user adoption</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-orange-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Smartphone className="h-8 w-8 text-orange-500" />
                <div>
                  <CardTitle className="text-lg">SMS</CardTitle>
                  <p className="text-sm text-gray-600">Text Message Interface</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Universal compatibility</li>
                <li>• Structured format</li>
                <li>• Quick submission</li>
                <li>• Low bandwidth</li>
              </ul>
            </CardContent>
          </Card>
        </div>
        <div className="bg-blue-50 p-6 rounded-lg">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-500" />
            Validation Features
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p>• Real-time vote count validation</p>
              <p>• Document format verification</p>
              <p>• Duplicate submission prevention</p>
            </div>
            <div>
              <p>• Statistical anomaly detection</p>
              <p>• Automatic flagging system</p>
              <p>• Cross-channel consistency checks</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 5,
    title: "Real-Time Dashboard & Analytics",
    subtitle: "Live Election Monitoring",
    content: (
      <div className="space-y-8">
        <div className="grid grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                Live Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="bg-white p-3 rounded border">
                  <p className="text-2xl font-bold text-blue-600">453</p>
                  <p className="text-sm text-gray-600">Total Centers</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-2xl font-bold text-green-600">89%</p>
                  <p className="text-sm text-gray-600">Results Received</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-2xl font-bold text-orange-600">95%</p>
                  <p className="text-sm text-gray-600">Verified</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Vote className="h-6 w-6 text-green-600" />
                Party Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">UDA</span>
                  <span className="text-sm font-semibold">45.2%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{width: '45.2%'}}></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">DPP</span>
                  <span className="text-sm font-semibold">32.8%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{width: '32.8%'}}></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">MCP</span>
                  <span className="text-sm font-semibold">22.0%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{width: '22%'}}></div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-purple-600" />
                Quality Control
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Pending Review</span>
                  <Badge variant="outline">24</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Flagged Results</span>
                  <Badge variant="destructive">3</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Complaints</span>
                  <Badge variant="secondary">7</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Active Agents</span>
                  <Badge variant="default">156</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="font-semibold mb-3">Real-Time Features</h4>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Live Updates
              </h5>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• WebSocket connections for instant updates</li>
                <li>• Real-time result aggregation</li>
                <li>• Live verification status changes</li>
                <li>• Automatic dashboard refresh</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-2 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-green-500" />
                Interactive Charts
              </h5>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Hierarchical results visualization</li>
                <li>• Party performance tracking</li>
                <li>• Submission trends analysis</li>
                <li>• Geographic result mapping</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 6,
    title: "Verification & Quality Control",
    subtitle: "Multi-Layer Result Validation",
    content: (
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Verification Workflow</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                <div>
                  <h4 className="font-semibold">Automatic Validation</h4>
                  <p className="text-sm text-gray-600">Vote count checks, format validation, duplicate detection</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                <div>
                  <h4 className="font-semibold">Document Review</h4>
                  <p className="text-sm text-gray-600">Uploaded photos and documents verification</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                <div>
                  <h4 className="font-semibold">Manual Verification</h4>
                  <p className="text-sm text-gray-600">Supervisor/reviewer approval process</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
                <div>
                  <h4 className="font-semibold">Final Approval</h4>
                  <p className="text-sm text-gray-600">Result marked as verified and published</p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Quality Assurance</h3>
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-center">Verified Results</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-2xl font-bold text-green-600">95%</div>
                  <p className="text-xs text-gray-600">Auto-verified</p>
                </CardContent>
              </Card>
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-center">Pending Review</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">3%</div>
                  <p className="text-xs text-gray-600">Manual review</p>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-center">Flagged</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-2xl font-bold text-red-600">1%</div>
                  <p className="text-xs text-gray-600">Issues found</p>
                </CardContent>
              </Card>
              <Card className="border-gray-200 bg-gray-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-center">Rejected</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-2xl font-bold text-gray-600">1%</div>
                  <p className="text-xs text-gray-600">Invalid data</p>
                </CardContent>
              </Card>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold mb-3">Validation Rules</h4>
              <ul className="text-sm space-y-1">
                <li>• Vote count consistency checks</li>
                <li>• Statistical anomaly detection</li>
                <li>• Document format verification</li>
                <li>• Cross-reference validation</li>
                <li>• Duplicate submission prevention</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 7,
    title: "Complaint Management System",
    subtitle: "Structured Election Issue Handling",
    content: (
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Complaint Categories</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-700">Voting Irregularity</h4>
                <p className="text-xs text-red-600">Polling procedure violations</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-700">Result Dispute</h4>
                <p className="text-xs text-orange-600">Vote count discrepancies</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-700">Procedural Violation</h4>
                <p className="text-xs text-yellow-600">Process compliance issues</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-700">Fraud Allegation</h4>
                <p className="text-xs text-purple-600">Suspected fraudulent activity</p>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Escalation Process</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded">
                <Badge variant="default">1</Badge>
                <div>
                  <p className="font-medium">Initial Submission</p>
                  <p className="text-sm text-gray-600">Agent or observer reports issue</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded">
                <Badge variant="default">2</Badge>
                <div>
                  <p className="font-medium">Internal Review</p>
                  <p className="text-sm text-gray-600">Supervisor investigates and responds</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded">
                <Badge variant="default">3</Badge>
                <div>
                  <p className="font-medium">MEC Escalation</p>
                  <p className="text-sm text-gray-600">Complex cases forwarded to MEC</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded">
                <Badge variant="default">4</Badge>
                <div>
                  <p className="font-medium">Resolution</p>
                  <p className="text-sm text-gray-600">Final decision and action taken</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <Card className="text-center">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">7</CardTitle>
              <p className="text-sm text-gray-600">Total Complaints</p>
            </CardHeader>
          </Card>
          <Card className="text-center">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">4</CardTitle>
              <p className="text-sm text-gray-600">Under Review</p>
            </CardHeader>
          </Card>
          <Card className="text-center">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">1</CardTitle>
              <p className="text-sm text-gray-600">Escalated to MEC</p>
            </CardHeader>
          </Card>
          <Card className="text-center">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">2</CardTitle>
              <p className="text-sm text-gray-600">Resolved</p>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  },
  {
    id: 8,
    title: "Technical Architecture",
    subtitle: "Modern, Scalable Technology Stack",
    content: (
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Frontend Technology</h3>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800">React 18 + TypeScript</h4>
                <p className="text-sm text-blue-600">Modern component architecture with type safety</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800">Shadcn/ui + Tailwind CSS</h4>
                <p className="text-sm text-green-600">Responsive design with accessible components</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800">TanStack Query</h4>
                <p className="text-sm text-purple-600">Efficient server state management and caching</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-800">WebSocket Integration</h4>
                <p className="text-sm text-orange-600">Real-time updates and live notifications</p>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Backend Infrastructure</h3>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800">Node.js + Express</h4>
                <p className="text-sm text-gray-600">High-performance server with RESTful APIs</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <h4 className="font-semibold text-indigo-800">PostgreSQL + Drizzle ORM</h4>
                <p className="text-sm text-indigo-600">Robust database with type-safe queries</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800">Multi-Provider Integrations</h4>
                <p className="text-sm text-red-600">USSD, WhatsApp, SMS service providers</p>
              </div>
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                <h4 className="font-semibold text-teal-800">Security & Authentication</h4>
                <p className="text-sm text-teal-600">Bcrypt encryption, session management</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="font-semibold mb-4">System Capabilities</h4>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <h5 className="font-medium mb-2 text-blue-600">Performance</h5>
              <ul className="text-sm space-y-1">
                <li>• Real-time data processing</li>
                <li>• Efficient database indexing</li>
                <li>• Optimized query performance</li>
                <li>• Scalable architecture</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-2 text-green-600">Security</h5>
              <ul className="text-sm space-y-1">
                <li>• End-to-end encryption</li>
                <li>• Role-based access control</li>
                <li>• Comprehensive audit trails</li>
                <li>• Secure file handling</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-2 text-purple-600">Reliability</h5>
              <ul className="text-sm space-y-1">
                <li>• Data validation & verification</li>
                <li>• Error handling & recovery</li>
                <li>• Backup & restore capabilities</li>
                <li>• Multi-channel redundancy</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 9,
    title: "Deployment & Scalability",
    subtitle: "Production-Ready Infrastructure",
    content: (
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Deployment Options</h3>
            <div className="space-y-4">
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    Cloud Platforms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1">
                    <li>• Railway (Recommended)</li>
                    <li>• Render</li>
                    <li>• Heroku</li>
                    <li>• Netlify</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="h-5 w-5 text-green-600" />
                    Database Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1">
                    <li>• PostgreSQL (Primary)</li>
                    <li>• Neon Database</li>
                    <li>• Railway PostgreSQL</li>
                    <li>• Self-hosted options</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Scalability Features</h3>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold mb-2">Performance Optimization</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Database connection pooling</li>
                  <li>• Efficient query optimization</li>
                  <li>• Caching strategies</li>
                  <li>• Load balancing ready</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold mb-2">Monitoring & Analytics</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Health check endpoints</li>
                  <li>• Comprehensive logging</li>
                  <li>• Performance metrics</li>
                  <li>• Error tracking</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border">
          <h4 className="font-semibold mb-4">Production Requirements</h4>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <h5 className="font-medium mb-2">Environment Variables</h5>
              <ul className="text-xs space-y-1 text-gray-600">
                <li>• DATABASE_URL</li>
                <li>• SESSION_SECRET</li>
                <li>• ENCRYPTION_KEY</li>
                <li>• NODE_ENV=production</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-2">Security Setup</h5>
              <ul className="text-xs space-y-1 text-gray-600">
                <li>• HTTPS enforcement</li>
                <li>• Firewall configuration</li>
                <li>• Regular security updates</li>
                <li>• Backup strategies</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-2">Monitoring</h5>
              <ul className="text-xs space-y-1 text-gray-600">
                <li>• Health check endpoints</li>
                <li>• Performance monitoring</li>
                <li>• Error logging</li>
                <li>• Usage analytics</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 10,
    title: "Benefits & Impact",
    subtitle: "Transforming Election Management",
    content: (
      <div className="space-y-8 text-center">
        <div className="grid grid-cols-3 gap-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader>
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">Transparency</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Real-time visibility into election results with comprehensive audit trails and verification processes</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader>
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Streamlined result submission and verification process reducing manual effort and processing time</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader>
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">Accessibility</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Multiple submission channels ensuring all agents can participate regardless of device capabilities</p>
            </CardContent>
          </Card>
        </div>
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-8 rounded-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Key Success Metrics</h3>
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">98%</div>
              <p className="text-sm text-gray-600">Result Accuracy</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">75%</div>
              <p className="text-sm text-gray-600">Time Reduction</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">4x</div>
              <p className="text-sm text-gray-600">Faster Processing</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">100%</div>
              <p className="text-sm text-gray-600">Digital Coverage</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-lg border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Thank You</h3>
          <p className="text-lg text-gray-600 mb-6">
            The Parallel Tally Center System represents a comprehensive solution for modern election management, 
            combining transparency, efficiency, and accessibility in a secure, scalable platform.
          </p>
          <div className="flex justify-center gap-4">
            <Badge variant="default" className="px-4 py-2">Multi-Channel</Badge>
            <Badge variant="default" className="px-4 py-2">Real-Time</Badge>
            <Badge variant="default" className="px-4 py-2">Secure</Badge>
            <Badge variant="default" className="px-4 py-2">Scalable</Badge>
          </div>
        </div>
      </div>
    )
  }
];

export default function Presentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % slides.length);
      }, 10000); // Auto-advance every 10 seconds
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const toggleAutoPlay = () => {
    setIsPlaying(!isPlaying);
  };

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                <Vote className="text-white h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">PTC System Presentation</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {currentSlide + 1} / {slides.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAutoPlay}
                className="flex items-center gap-2"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? 'Pause' : 'Auto Play'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="min-h-[600px] shadow-lg">
          <CardHeader className="text-center bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-t-lg">
            <CardTitle className="text-3xl font-bold">{slide.title}</CardTitle>
            <p className="text-xl opacity-90">{slide.subtitle}</p>
          </CardHeader>
          <CardContent className="p-8">
            {slide.content}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          {/* Slide indicators */}
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide
                    ? 'bg-blue-500'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="flex items-center gap-2"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Slide overview */}
        <div className="mt-8 bg-white rounded-lg border p-4">
          <h3 className="font-semibold mb-3">Presentation Outline</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
            {slides.map((slideItem, index) => (
              <button
                key={slideItem.id}
                onClick={() => goToSlide(index)}
                className={`text-left p-2 rounded transition-colors ${
                  index === currentSlide
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <div className="font-medium">{index + 1}. {slideItem.title}</div>
                <div className="text-xs opacity-75">{slideItem.subtitle}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
