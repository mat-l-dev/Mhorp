'use client';

// src/hooks/use-referral-tracking.ts
// Propósito: Detectar y guardar código de referido de la URL

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const REFERRAL_CODE_KEY = 'mhorp_referral_code';
const REFERRAL_CODE_EXPIRY_DAYS = 30; // El código se mantiene por 30 días

export interface ReferralTracking {
  code: string | null;
  isValid: boolean;
  expiresAt: Date | null;
}

export function useReferralTracking() {
  const searchParams = useSearchParams();
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    // Verificar si hay código en la URL
    const urlCode = searchParams?.get('ref');
    
    if (urlCode) {
      // Guardar código en localStorage con fecha de expiración
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + REFERRAL_CODE_EXPIRY_DAYS);
      
      const referralData = {
        code: urlCode.toUpperCase(),
        expiresAt: expiryDate.toISOString(),
      };
      
      localStorage.setItem(REFERRAL_CODE_KEY, JSON.stringify(referralData));
      setReferralCode(urlCode.toUpperCase());
      
      console.log('✅ Código de referido guardado:', urlCode.toUpperCase());
    } else {
      // Verificar si hay código guardado
      const savedData = getSavedReferralCode();
      if (savedData) {
        setReferralCode(savedData.code);
      }
    }
  }, [searchParams]);

  return {
    referralCode,
    hasReferralCode: !!referralCode,
  };
}

// Función helper para obtener código guardado (válido)
export function getSavedReferralCode(): { code: string; expiresAt: Date } | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = localStorage.getItem(REFERRAL_CODE_KEY);
    if (!saved) return null;
    
    const data = JSON.parse(saved);
    const expiresAt = new Date(data.expiresAt);
    
    // Verificar si expiró
    if (expiresAt < new Date()) {
      localStorage.removeItem(REFERRAL_CODE_KEY);
      return null;
    }
    
    return {
      code: data.code,
      expiresAt,
    };
  } catch (error) {
    console.error('Error al leer código de referido:', error);
    localStorage.removeItem(REFERRAL_CODE_KEY);
    return null;
  }
}

// Función helper para limpiar código guardado (después de registrarse)
export function clearReferralCode() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(REFERRAL_CODE_KEY);
}

// Función helper para verificar si un usuario llegó por referido
export function hasActiveReferralCode(): boolean {
  return getSavedReferralCode() !== null;
}

// Función helper para obtener solo el código (sin metadata)
export function getReferralCode(): string | null {
  const saved = getSavedReferralCode();
  return saved?.code || null;
}
