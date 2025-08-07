import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { MessageCircle, Users, Shield, Zap } from "lucide-react";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/chat");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <MessageCircle className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-5xl font-bold text-gray-900">Alpha Chat</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect instantly with friends and colleagues through our secure,
            real-time messaging platform
          </p>
        </div>

        {/* Main CTA Section */}
        <div className="max-w-md mx-auto mb-16">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">Get Started</CardTitle>
              <CardDescription>
                Join thousands of users already chatting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/auth/signin" className="block">
                <Button className="w-full h-12 text-lg" size="lg">
                  Sign In
                </Button>
              </Link>

              <Link href="/auth/signup" className="block">
                <Button
                  variant="outline"
                  className="w-full h-12 text-lg"
                  size="lg"
                >
                  Create Account
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="text-center border-0 shadow-lg">
            <CardContent className="pt-8">
              <Zap className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Real-time Messaging
              </h3>
              <p className="text-gray-600">
                Instant message delivery with typing indicators and online
                status
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg">
            <CardContent className="pt-8">
              <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">File Sharing</h3>
              <p className="text-gray-600">
                Share images and videos seamlessly with your contacts
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg">
            <CardContent className="pt-8">
              <Shield className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Secure Authentication
              </h3>
              <p className="text-gray-600">
                Google OAuth and secure credential-based authentication
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
