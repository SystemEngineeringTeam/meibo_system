import { CustomContext } from '@/types/context';
import { AuthService } from '../service/auth.service';
import { drizzle } from 'drizzle-orm/d1';
import {
  memberPropertyTable,
  memberTable,
  officerTable,
  stackTable,
} from '../models/schema';
import { CustomResponse } from '@/types/response';
import { CreateUserSchema } from '../validation';
import { and, eq, isNull } from 'drizzle-orm';
import { CreatedAt, Id, MemberPropertyTable, MemberTable } from '@/types/table';
import { UserRes } from '@/types/response/user';
import { MemberBase, MemberType } from '@/types/member';
import { toDateISO } from '@/util';

/**
 * @private
 */
export class UserController {
  /**
   * ユーザーが見つからないエラー
   */
  private static error(
    c: CustomContext<string>,
    message: string,
  ): CustomResponse<never> {
    return c.json({ success: false, message }, 401);
  }

  /**
   * ユーザー情報をフラットにする
   */
  private static toFlatUser(
    member: CreateUserSchema['member'],
    uid: string,
    now: number,
  ): MemberPropertyTable<CreatedAt> {
    const { type } = member;

    const base = {
      uid: uid,
      createdAt: now,
      firstName: member.firstName,
      lastName: member.lastName,
      firstNameKana: member.firstNameKana,
      lastNameKana: member.lastNameKana,
      graduationYear: member.graduationYear,
      slackName: member.slackName,
      iconUrl: member.iconUrl,
      birthdate: member.privateInfo.birthdate,
      gender: member.privateInfo.gender,
      phoneNumber: member.privateInfo.phoneNumber,
      email: member.privateInfo.email,
      cuurentPostalCode: member.privateInfo.currentAddress.postalCode,
      currentAddress: member.privateInfo.currentAddress.address,
      homePostalCode: member.privateInfo.homeAddress.postalCode,
      homeAddress: member.privateInfo.homeAddress.address,
    };

    if (type === 'active') {
      return {
        type: 'active',
        studentNumber: member.studentNumber,
        position: member.position,
        grade: member.grade,
        ...base,
      };
    } else if (type === 'obog') {
      return {
        type: 'obog',
        oldPosition: member.oldPosition,
        oldStudentNumber: member.oldStudentNumber,
        employment: member.employment,
        ...base,
      };
    } else {
      return {
        type: 'external',
        school: member.school,
        organization: member.organization,
        ...base,
      };
    }
  }

  private static toStructUser(
    member: MemberTable<Id & CreatedAt>,
    propaty: MemberPropertyTable<CreatedAt>,
    skills: string[],
  ): MemberBase & MemberType {
    const { type } = propaty;

    const base: MemberBase = {
      id: member.id,
      createdAt: toDateISO(propaty.createdAt),
      updatedAt: toDateISO(member.createdAt),
      firstName: propaty.firstName,
      lastName: propaty.lastName,
      firstNameKana: propaty.firstNameKana,
      lastNameKana: propaty.lastNameKana,
      graduationYear: propaty.graduationYear,
      slackName: propaty.slackName,
      iconUrl: propaty.iconUrl,
      skills,
      privateInfo: {
        birthdate: propaty.birthdate,
        email: propaty.email,
        gender: propaty.gender,
        phoneNumber: propaty.phoneNumber,
        currentAddress: {
          address: propaty.currentAddress,
          postalCode: propaty.cuurentPostalCode,
        },
        homeAddress: {
          address: propaty.homeAddress,
          postalCode: propaty.homePostalCode,
        },
      },
    };

    if (type === 'active') {
      return {
        type: 'active',
        studentNumber: propaty.studentNumber,
        position: propaty.position,
        grade: propaty.grade,
        ...base,
      };
    } else if (type === 'obog') {
      return {
        type: 'obog',
        oldStudentNumber: propaty.oldStudentNumber,
        oldPosition: propaty.oldPosition,
        employment: propaty.employment,
        ...base,
      };
    } else {
      return {
        type: 'external',
        school: propaty.school,
        organization: propaty.organization,
        ...base,
      };
    }
  }

  /**
   * ユーザー登録
   */
  static async createUser(
    c: CustomContext<'/api/users'>,
  ): Promise<CustomResponse<UserRes>> {
    const { member } = await c.req.json<CreateUserSchema>();
    const user = AuthService.getUser(c);
    if (!user) return this.error(c, '認証に失敗しました');
    const db = drizzle(c.env.DB);

    // uid が存在するか確認
    const registeredMembers = await drizzle(c.env.DB)
      .select()
      .from(memberTable)
      .where(eq(memberTable.uid, user.uid));

    if (registeredMembers.length > 0)
      return this.error(c, '既に登録されています');

    const now = Date.now();
    // ユーザー情報を登録
    const [ids] = await db.batch([
      db
        .insert(memberTable)
        .values({ uid: user.uid, createdAt: now })
        .returning({ id: memberTable.id }),

      db.insert(stackTable).values(
        member.skills.map((s) => ({
          uid: user.uid,
          name: s,
          createdAt: now,
        })),
      ),
      db
        .insert(memberPropertyTable)
        .values(this.toFlatUser(member, user.uid, now)),
    ]);

    const res = { ...ids[0], ...member };
    return c.json({ success: true, member: res });
  }

  /**
   * ユーザー情報取得
   */
  static async getUser(
    c: CustomContext<'/api/users/:id/detail'>,
  ): Promise<CustomResponse<UserRes>> {
    const { id } = c.req.param();
    const idNum = Number(id);

    if (isNaN(idNum)) return this.error(c, 'IDが不正です');

    const user = AuthService.getUser(c);
    if (!user) return this.error(c, '認証に失敗しました');
    const db = drizzle(c.env.DB);

    // user.uid が一致するユーザー情報を取得
    const [memberData] = await db
      .select()
      .from(memberTable)
      .where(eq(memberTable.id, idNum));

    if (!memberData) return this.error(c, 'ユーザーが見つかりません');

    // 役員か
    const isOfficer = await db
      .select()
      .from(officerTable)
      .where(
        and(eq(officerTable.uid, user.uid), isNull(officerTable.deletedAt)),
      );

    if (isOfficer.length === 0 && user.uid !== memberData.uid)
      return this.error(c, '権限がありません');

    // スキルを取得
    const skillsMap = await db
      .select({ name: stackTable.name })
      .from(stackTable)
      .where(eq(stackTable.uid, memberData.uid));
    const skills = skillsMap.map((s) => s.name);

    // ユーザー情報を取得
    const [propaty] = await db
      .select()
      .from(memberPropertyTable)
      .where(eq(memberPropertyTable.uid, memberData.uid));

    return c.json({
      success: true,
      member: this.toStructUser(
        memberData,
        propaty as MemberPropertyTable<CreatedAt>,
        skills,
      ),
    });
  }
}
