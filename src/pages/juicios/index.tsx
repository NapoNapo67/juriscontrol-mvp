import React from 'react';
import { MainLayout } from '../../components/Layout/MainLayout';
import { JuiciosList } from '../../components/Juicios/JuiciosList';

export default function JuiciosPage() {
  return (
    <MainLayout>
      <JuiciosList />
    </MainLayout>
  );
}
