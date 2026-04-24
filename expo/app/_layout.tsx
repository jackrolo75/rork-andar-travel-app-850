import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ActivitiesProvider } from "@/contexts/ActivitiesContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { initCrashReporting } from "@/services/crashReporting";

void SplashScreen.preventAutoHideAsync();
console.log("[RootLayout] App initializing");

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="activities-search" options={{ headerShown: false }} />
      <Stack.Screen name="activities-results" options={{ headerShown: false }} />
      <Stack.Screen name="activity-details" options={{ headerShown: false }} />
      <Stack.Screen name="activities-booking" options={{ headerShown: false }} />
      <Stack.Screen name="activity-payment" options={{ headerShown: false }} />
      <Stack.Screen name="activity-confirmation" options={{ headerShown: false }} />
      <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
      <Stack.Screen name="favorites" options={{ headerShown: false }} />
      <Stack.Screen name="promotions" options={{ headerShown: false }} />
      <Stack.Screen name="terms-of-service" options={{ headerShown: false }} />
      <Stack.Screen name="contact" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    initCrashReporting();
    void SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ErrorBoundary>
          <LocaleProvider>
            <ActivitiesProvider>
              <RootLayoutNav />
            </ActivitiesProvider>
          </LocaleProvider>
        </ErrorBoundary>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
