# ユースケースのボイラープレート

## 目的
このファイルは、特定のビジネスユースケースを実装します。ユースケースは
アプリケーションの中核的な機能を表し、ドメインロジックを実行します。

## 配置場所
`server/server-usecase/{usecase-name}.server-usecase.ts`

## ルール
1. ファイル名は `{usecase-name}.server-usecase.ts` とする
2. 単一責任の原則に従い、一つのユースケースに集中する
3. 依存性を明示的に注入する
4. エラーハンドリングを適切に実装する
5. 型安全性を確保する
6. ビジネスロジックに集中し、インフラストラクチャの詳細は抽象化する
7. 内部実装を定義した後、最後に定数としてエクスポートする

## 実装例

```typescript
import { prisma } from 'server/server-lib/prisma-service.util';
import { {DomainName}Entity } from 'common/domains/{domain-name}.entity';
import { {domainName}Mapper } from 'server/server-mappers/{domain-name}/index.mapper';

/**
 * {UsecaseName}ユースケースの入力
 */
type {UsecaseName}Input = {
  /**
   * 操作対象の{DomainName}のID
   */
  {domainName}Id: string;

  /**
   * ユースケース固有のパラメータ
   */
  params: {
    // パラメータの定義...
    someParam: string;
    anotherParam?: number;
  };

  /**
   * 現在のユーザーのID（認証/認可用）
   */
  currentUserId: string;
};

/**
 * {UsecaseName}ユースケースの出力
 */
type {UsecaseName}Output = {
  /**
   * 操作の結果
   */
  result: {
    // 結果の定義...
    {domainName}: {DomainName}Entity;
    additionalData?: any;
  };

  /**
   * 成功メッセージ
   */
  message: string;
};

/**
 * {UsecaseName}ユースケースの実装
 */
const usecase = {
  /**
   * ユースケースを実行します
   * @param input ユースケース入力
   * @returns ユースケース出力
   */
  async execute(input: {UsecaseName}Input): Promise<{UsecaseName}Output> {
    const { {domainName}Id, params, currentUserId } = input;

    // 認可チェック
    await this.checkAuthorization({domainName}Id, currentUserId);

    // データの取得
    const {domainName} = await this.get{DomainName}({domainName}Id);

    // ビジネスロジックの実行
    const result = await this.process{DomainName}({domainName}, params);

    // 結果の返却
    return {
      result: {
        {domainName}: result,
      },
      message: '{DomainName}が正常に処理されました',
    };
  },

  /**
   * 認可チェックを行います
   * @param {domainName}Id {DomainName}のID
   * @param currentUserId 現在のユーザーのID
   */
  async checkAuthorization({domainName}Id: string, currentUserId: string): Promise<void> {
    // 認可ロジックの実装...
    const {domainName} = await prisma.{domainName}.findUnique({
      where: { id: {domainName}Id },
    });

    if (!{domainName}) {
      throw new Error('{DomainName}が見つかりません');
    }

    // 権限チェックの例
    const hasPermission = await this.userHasPermission(currentUserId, {domainName}Id);
    if (!hasPermission) {
      throw new Error('この操作を実行する権限がありません');
    }
  },

  /**
   * ユーザーが{DomainName}に対する権限を持っているかチェックします
   * @param userId ユーザーID
   * @param {domainName}Id {DomainName}ID
   * @returns 権限があるかどうか
   */
  async userHasPermission(userId: string, {domainName}Id: string): Promise<boolean> {
    // 権限チェックロジックの実装...
    return true; // 実際の実装ではより複雑なロジックになる
  },

  /**
   * {DomainName}を取得します
   * @param {domainName}Id {DomainName}のID
   * @returns {DomainName}エンティティ
   */
  async get{DomainName}({domainName}Id: string): Promise<{DomainName}Entity> {
    const {domainName} = await prisma.{domainName}.findUnique({
      where: { id: {domainName}Id },
    });

    if (!{domainName}) {
      throw new Error('{DomainName}が見つかりません');
    }

    return {domainName}Mapper.toDTO({domainName});
  },

  /**
   * {DomainName}に対するビジネスロジックを実行します
   * @param {domainName} {DomainName}エンティティ
   * @param params パラメータ
   * @returns 処理後の{DomainName}エンティティ
   */
  async process{DomainName}({domainName}: {DomainName}Entity, params: {UsecaseName}Input['params']): Promise<{DomainName}Entity> {
    // ビジネスロジックの実装...
    
    // 例: パラメータに基づいて{DomainName}を更新
    const updated{DomainName} = await prisma.{domainName}.update({
      where: { id: {domainName}.id },
      data: {
        // 更新データ...
        // someField: params.someParam,
      },
    });

    return {domainName}Mapper.toDTO(updated{DomainName});
  },
};

// ユースケースをエクスポート
export const {usecaseName}Usecase = usecase;
```

## 使用例

```typescript
// server/server-usecase/generate-user-response.server-usecase.ts
import { prisma } from 'server/server-lib/prisma-service.util';
import { UserEntity } from 'common/domains/user.entity';
import { PromptEntity } from 'common/domains/prompt.entity';
import { userMapper } from 'server/server-mappers/users/index.mapper';
import { promptMapper } from 'server/server-mappers/prompts/index.mapper';

type GenerateUserResponseInput = {
  promptId: string;
  params: {
    responseType: 'text' | 'image';
    maxLength?: number;
  };
  currentUserId: string;
};

type GenerateUserResponseOutput = {
  result: {
    prompt: PromptEntity;
    response: string;
    user: UserEntity;
  };
  message: string;
};

const usecase = {
  async execute(input: GenerateUserResponseInput): Promise<GenerateUserResponseOutput> {
    const { promptId, params, currentUserId } = input;

    // 認可チェック
    await this.checkAuthorization(promptId, currentUserId);

    // データの取得
    const prompt = await this.getPrompt(promptId);
    const user = await this.getUser(currentUserId);

    // ビジネスロジックの実行
    const response = await this.generateResponse(prompt, params);

    // 結果の返却
    return {
      result: {
        prompt,
        response,
        user,
      },
      message: 'レスポンスが正常に生成されました',
    };
  },
  
  // 他のメソッド...
};

export const generateUserResponseUsecase = usecase;
```

## APIエンドポイントでの使用例

```typescript
// server/router/prompts/generate-response.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { generateResponseSchema } from './schema/generate-response.schema';
import { generateUserResponseUsecase } from 'server/server-usecase/generate-user-response.server-usecase';

const app = new Hono();

app.post('/:id/generate', zValidator('json', generateResponseSchema), async (c) => {
  try {
    const promptId = c.req.param('id');
    const data = c.req.valid('json');
    const currentUserId = c.get('userId'); // ミドルウェアから取得
    
    const result = await generateUserResponseUsecase.execute({
      promptId,
      params: data,
      currentUserId,
    });
    
    return c.json(result);
  } catch (error) {
    // エラーハンドリング...
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;
