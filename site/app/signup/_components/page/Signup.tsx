import QRCode from 'react-qr-code';
import styles from './signup.module.scss';
import { ROUTES } from '@/const/path';

export default function SignupPage() {
  return (
    <main className={styles.signup}>
      <div className={styles.container}>
        <QRCode className={styles.qrcode} value="https://satooru.me" />

        <a href={ROUTES.registration.path} className={styles.registration}>
          登録に進む
        </a>
      </div>
    </main>
  );
}
