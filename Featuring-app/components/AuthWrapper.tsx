import React, { useEffect } from 'react'
import { View } from 'react-native'
import { useSuspensionCheck } from '../hooks/useSuspensionCheck'
import { SuspendedScreen } from './SuspendedScreen'

interface AuthWrapperProps {
  children: React.ReactNode
}

export const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const { isSuspended } = useSuspensionCheck()

  if (isSuspended) {
    return <SuspendedScreen />
  }

  return <>{children}</>
} 