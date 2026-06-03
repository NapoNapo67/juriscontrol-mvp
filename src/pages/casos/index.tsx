import React from 'react';
import { MainLayout } from '../../components/Layout/MainLayout';
import { CasosList } from '../../components/Casos/CasosList';

export default function CasosPage() {
  return (
    <MainLayout>
      <CasosList />
    </MainLayout>
  );
}
