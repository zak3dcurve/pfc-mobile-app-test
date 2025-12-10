// src/hooks/useTopdonCamera.js

import { useState, useEffect, useCallback } from 'react';
import TopdonThermal from '../plugins/topdon-thermal';

export const useTopdonCamera = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState(null);

  // Initialize camera on mount
  useEffect(() => {
    const initCamera = async () => {
      try {
        const result = await TopdonThermal.initialize();
        if (result.success) {
          setIsInitialized(true);
          console.log('Topdon camera initialized:', result.message);
          
          // Check if camera is ready
          const readyResult = await TopdonThermal.isReady();
          setIsReady(readyResult.ready);
        }
      } catch (err) {
        console.error('Failed to initialize camera:', err);
        setError(err.message || String(err));
      }
    };

    initCamera();

    // Cleanup on unmount
    return () => {
      TopdonThermal.release().catch(console.error);
    };
  }, []);

  // Check camera readiness periodically
  useEffect(() => {
    if (!isInitialized) return;

    const checkReady = async () => {
      try {
        const result = await TopdonThermal.isReady();
        setIsReady(result.ready);
      } catch (err) {
        console.error('Failed to check camera readiness:', err);
      }
    };

    // Check every 2 seconds
    const interval = setInterval(checkReady, 2000);
    return () => clearInterval(interval);
  }, [isInitialized]);

  // Capture image
  const captureImage = useCallback(async () => {
    if (!isReady) {
      setError('Camera not ready. Please connect Topdon TC001.');
      return null;
    }

    setIsCapturing(true);
    setError(null);

    try {
      const result = await TopdonThermal.captureImage();
      console.log('Image captured:', {
        width: result.width,
        height: result.height,
        hasTemp: !!result.centerTemperature
      });
      return result;
    } catch (err) {
      const errorMsg = err.message || String(err);
      console.error('Failed to capture image:', errorMsg);
      setError(errorMsg);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [isReady]);

  // Get connected devices (for debugging)
  const getConnectedDevices = useCallback(async () => {
    try {
      const result = await TopdonThermal.getConnectedDevices();
      return result.devices;
    } catch (err) {
      console.error('Failed to get devices:', err);
      return 'Error getting devices';
    }
  }, []);

  return {
    isInitialized,
    isReady,
    isCapturing,
    error,
    captureImage,
    getConnectedDevices,
  };
};
