'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './payment.module.scss';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { ROUTES } from '@/const/path';

const SAMPLE_PAYEES = [
  { key: 0, value: '' },
  { key: 1, value: '佐藤 智' },
  { key: 2, value: '鈴木 一郎' },
  { key: 3, value: '田中 二郎' },
];

export default function PayeePage() {
  const [payee, setPayee] = useState<number | undefined>(undefined);
  const [error, setError] = useState('');
  const router = useRouter();

  function handleSubmit() {
    if (payee === undefined) {
      setError('選択してください');
      return;
    }

    router.push(ROUTES.user.path);
  }

  return (
    <main className={styles.payment}>
      <div className={styles.wrapper}>
        <h2>お金を渡した人</h2>
        <Select<number[]>
          options={SAMPLE_PAYEES}
          set={(id) => setPayee(id)}
          className={styles.select}
          error={error}
        />

        <Button className={styles.submit} onClick={handleSubmit}>
          送信
        </Button>
      </div>
    </main>
  );
}
