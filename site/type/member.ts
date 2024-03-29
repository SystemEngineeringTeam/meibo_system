export const memberKeys = [
  'id',
  'firstName',
  'lastName',
  'firstNameKana',
  'lastNameKana',
  'skills',
  'graduationYear',
  'slackName',
  'updatedAt',
  'createdAt',
  'privateInfo',
] as const;
export const privateInfoKeys = [
  'birthdate',
  'gender',
  'phoneNumber',
  'email',
  'currentAddress',
  'homeAddress',
] as const;
export const addressKeys = ['postalCode', 'address'] as const;

// キーの型
export type MemberKeys = (typeof memberKeys)[number];
export type PrivateInfoKeys = (typeof privateInfoKeys)[number];
export type AddressKeys = (typeof addressKeys)[number];

// 住所と郵便番号
export type Address = {
  postalCode: string;
  address: string;
};

// 非公開の情報
export type PrivateInfo = {
  birthdate: string;
  gender: string;
  phoneNumber: string;
  email: string;
  currentAddress: Address;
  homeAddress: Address;
};

// 現役部員
export type ActiveMember = {
  type: 'active';
  studentNumber: string;
  position: string;
  grade: string;
};

// OB・OG
export type OBOGMember = {
  type: 'obog';
  oldPosition: string;
  oldStudentNumber: string;
  employment: string;
};

// 外部
export type ExternalMember = {
  type: 'external';
  school: string;
  organization: string;
};

// 未選択
export type UnselectedMember = {
  type: null;
};

export type MemberBase = {
  id: number;
  firstName: string;
  lastName: string;
  firstNameKana: string;
  lastNameKana: string;
  skills: string[];
  graduationYear: number;
  slackName: string;
  iconUrl: string;
};

export type Member = MemberBase &
  (ActiveMember | OBOGMember | ExternalMember | UnselectedMember);

export type MemberWithPrivateInfo = Member & {
  privateInfo: PrivateInfo;
};

export type MemberKeysWithPrivateInfo =
  | MemberKeys
  | PrivateInfoKeys
  | AddressKeys;

export type MemberType =
  | ActiveMember['type']
  | OBOGMember['type']
  | ExternalMember['type']
  | UnselectedMember['type'];

export type MemberAll = MemberBase & { privateInfo: PrivateInfo } & Omit<
    ActiveMember,
    'type'
  > &
  Omit<OBOGMember, 'type'> &
  Omit<ExternalMember, 'type'> & { type: MemberType };

export type Nullable<T> = {
  [K in keyof T]: T[K] extends object
    ? T[K] extends any[]
      ? T[K]
      : Nullable<T[K]>
    : T[K] | null;
};

export type MemberError = {
  // eslint-disable-next-line no-unused-vars
  [K in
    | MemberKeysWithPrivateInfo
    | keyof ActiveMember
    | keyof OBOGMember
    | keyof ExternalMember
    | 'name'
    | 'kana'
    | 'currentPostalCode'
    | 'homePostalCode']?: string;
};

export type MemberProps = {
  [key: string]: any;
}