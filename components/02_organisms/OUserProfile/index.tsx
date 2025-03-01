import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import useUserPrivate from '@/hooks/resources/user-private/useUserPrivate'
import { usePrivyAuthentication } from '@/hooks/usePrivyAuthentication'
import { Loader2, LogOut } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const Component = () => {
  const { logout } = usePrivyAuthentication({
    redirectUrl: '/',
  })
  const { userPrivate, userPrivateError, userPrivateIsLoading, updateUserPrivate } =
    useUserPrivate()
  const [isOpen, setIsOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  // DiceBearのアバターURLを生成
  const generateAvatarUrl = (name: string) => {
    const seed = name || 'Anonymous User'
    return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(seed)}`
  }

  const handleUpdateName = async () => {
    if (!userPrivate || !newName.trim()) return

    try {
      setIsUpdating(true)
      await updateUserPrivate({
        ...userPrivate,
        name: newName.trim(),
      })
      toast.success('Profile updated', {
        description: 'Your display name has been updated successfully.',
      })
      setIsOpen(false)
    } catch (error) {
      toast.error('Update failed', {
        description: 'Failed to update your profile. Please try again.',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleLogout = () => {
    logout()
    toast.info('Logged out', {
      description: 'You have been logged out successfully.',
    })
  }

  if (userPrivateIsLoading)
    return (
      <div className="flex w-full items-center justify-center gap-2">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      </div>
    )

  if (userPrivateError) {
    return <div>Error: {userPrivateError}</div>
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <div className="flex cursor-pointer items-center gap-2 hover:opacity-80">
          {userPrivate?.name && (
            <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={generateAvatarUrl(
                  userPrivate.solanaSystemAccountAddress || userPrivate.email || userPrivate.name,
                )}
                alt="User Avatar"
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-foreground-soft text-md">User Profile</div>
            <div className="truncate text-xs">{userPrivate?.name}</div>
          </div>
        </div>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Profile</AlertDialogTitle>
          <AlertDialogDescription>
            Update your profile information here. Click save when you&apos;re done.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          <div className="mb-4 flex items-center justify-center">
            {userPrivate?.name && (
              <div className="h-20 w-20 overflow-hidden rounded-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={generateAvatarUrl(
                    userPrivate.solanaSystemAccountAddress || userPrivate.email || userPrivate.name,
                  )}
                  alt="User Avatar"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Display Name
            </Label>
            <Input
              id="name"
              defaultValue={userPrivate?.name}
              onChange={(e) => setNewName(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-1 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="mr-1 h-3.5 w-3.5" />
            <span className="text-xs">Logout</span>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateName} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { Component as OUserProfile }
