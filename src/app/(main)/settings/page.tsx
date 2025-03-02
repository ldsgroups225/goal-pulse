'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch by only rendering once mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application preferences and appearance.
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-medium mb-2">Appearance</h2>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark themes
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className={theme === 'light' ? 'bg-primary/10 text-primary' : ''}
                  onClick={() => setTheme('light')}
                >
                  <Sun className="h-[1.2rem] w-[1.2rem]" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={theme === 'dark' ? 'bg-primary/10 text-primary' : ''}
                  onClick={() => setTheme('dark')}
                >
                  <Moon className="h-[1.2rem] w-[1.2rem]" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="system-theme">Use system theme</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically match your device's theme settings
                </p>
              </div>
              <Switch
                id="system-theme"
                checked={theme === 'system'}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setTheme('system')
                  }
                  else {
                    setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-2">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="match-notifications">Match Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications for upcoming matches
                </p>
              </div>
              <Switch id="match-notifications" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="goal-notifications">Goal Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when goals are scored in matches you follow
                </p>
              </div>
              <Switch id="goal-notifications" defaultChecked />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-medium">About Goal Pulse</h2>
        <p className="text-sm text-muted-foreground">
          Goal Pulse provides live soccer match predictions and statistics
          to help you stay updated on your favorite matches.
        </p>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">Privacy Policy</Button>
          <Button variant="outline" size="sm">Terms of Service</Button>
        </div>
      </Card>
    </div>
  )
}
