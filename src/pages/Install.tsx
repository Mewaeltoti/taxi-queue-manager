import { Smartphone, Apple, Chrome, Share, Plus, MoreVertical, Download, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';

export default function Install() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Install App</h1>
            <p className="text-muted-foreground text-sm">Add to your home screen for the best experience</p>
          </div>
        </div>

        {/* Benefits Card */}
        <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="h-5 w-5 text-primary" />
              Why Install?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <span>Works offline - continue working without internet</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <span>Faster loading with instant app launch</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <span>Full screen experience without browser UI</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <span>Easy access from your home screen</span>
            </div>
          </CardContent>
        </Card>

        {/* Installation Instructions */}
        <Tabs defaultValue="ios" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="ios" className="flex items-center gap-2">
              <Apple className="h-4 w-4" />
              iPhone / iPad
            </TabsTrigger>
            <TabsTrigger value="android" className="flex items-center gap-2">
              <Chrome className="h-4 w-4" />
              Android
            </TabsTrigger>
          </TabsList>

          {/* iOS Instructions */}
          <TabsContent value="ios" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-primary">Safari Browser Required</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Make sure you're using Safari browser. Other browsers on iOS don't support installing apps.
              </CardContent>
            </Card>

            <div className="space-y-3">
              {/* Step 1 */}
              <Card className="overflow-hidden">
                <div className="flex items-start gap-4 p-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="font-bold text-primary">1</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1">Tap the Share button</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Find the share icon at the bottom of Safari (square with arrow pointing up)
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border">
                      <Share className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">Share</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Step 2 */}
              <Card className="overflow-hidden">
                <div className="flex items-start gap-4 p-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="font-bold text-primary">2</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1">Scroll down and tap "Add to Home Screen"</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Look for this option in the share menu
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border">
                      <Plus className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">Add to Home Screen</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Step 3 */}
              <Card className="overflow-hidden">
                <div className="flex items-start gap-4 p-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="font-bold text-primary">3</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1">Tap "Add" to confirm</h3>
                    <p className="text-sm text-muted-foreground">
                      The app icon will appear on your home screen. Tap it anytime to open the app!
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Android Instructions */}
          <TabsContent value="android" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-primary">Chrome Browser Recommended</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Use Chrome for the best installation experience. Other browsers may have similar options.
              </CardContent>
            </Card>

            <div className="space-y-3">
              {/* Step 1 */}
              <Card className="overflow-hidden">
                <div className="flex items-start gap-4 p-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="font-bold text-primary">1</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1">Tap the menu button</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Find the three dots in the top-right corner of Chrome
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border">
                      <MoreVertical className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">Menu</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Step 2 */}
              <Card className="overflow-hidden">
                <div className="flex items-start gap-4 p-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="font-bold text-primary">2</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1">Tap "Install app" or "Add to Home screen"</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      The option name may vary slightly depending on your device
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border">
                      <Download className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">Install app</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Step 3 */}
              <Card className="overflow-hidden">
                <div className="flex items-start gap-4 p-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="font-bold text-primary">3</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1">Confirm the installation</h3>
                    <p className="text-sm text-muted-foreground">
                      Tap "Install" or "Add" in the popup. The app will be added to your home screen!
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Note */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Already installed? Open the app from your home screen for the best experience.
        </p>
      </div>
    </div>
  );
}
