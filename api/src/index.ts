import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { UserController } from './controller';
import { CustomContext, Env } from '@/types/context';
import {
  VerifyFirebaseAuthConfig,
  verifyFirebaseAuth,
} from '@hono/firebase-auth';
import { CreateUserSchema, createUserSchema, zodHook } from './validation';
import { zValidator } from '@hono/zod-validator';

const config: VerifyFirebaseAuthConfig = {
  projectId: 'meibo-system',
};

const app = new Hono<Env>();

app.use('*', cors({ origin: '*' }));
app.use('/api/*', verifyFirebaseAuth(config));

// デバッグ用
app.get('/', (c) => c.text('Hello Hono!'));

// ユーザー登録
app.post(
  '/api/users',
  zValidator(
    'json',
    createUserSchema,
    zodHook<CreateUserSchema, CustomContext<'/api/users'>>,
  ),
  async (c) => await UserController.createUser(c),
);

app.all('*', (c) => c.text('Not Found', 404));

export default app;
