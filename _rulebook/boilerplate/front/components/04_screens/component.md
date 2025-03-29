# スクリーンコンポーネントのボイラープレート

## 目的
このファイルは、画面全体を構成するコンポーネントを定義します。
スクリーンコンポーネントは、アプリケーションの1つのページまたはビューを表し、
通常はリソースフックを通じてデータを取得します。

## 配置場所
`front/components/04_screens/S{ScreenName}/index.tsx`

## ルール
1. ファイル名は `index.tsx` とし、適切なディレクトリに配置する
2. ディレクトリ名は `S{ScreenName}` とする（例: `SUserShowScreen`, `SPromptListScreen`）
3. Propsの型を定義する（type Props = {...}）
4. コンポーネントを実装する（const Component = (props: Props) => {...}）
5. エクスポートする（export { Component as SScreenName }）
6. プライベートコンポーネントは同じファイル内に定義し、エクスポートしない
7. 必要に応じてテンプレート、オーガニズム、エレメントコンポーネントを使用する
8. 画面全体を構成し、通常はルーティングの対象となる

## 実装例

```typescript
import { FC } from 'react';
import { useRouter } from 'next/router';
import { EButton } from 'front/components/01_elements/EButton';
import { T{TemplateName} } from 'front/components/03_templates/T{TemplateName}';
import { {DomainName}Entity } from 'common/domains/{domain-name}.entity';
import { use{DomainName} } from 'front/hooks/resources/use{DomainName}';

/**
 * S{ScreenName}のプロパティ
 */
type Props = {
  /**
   * 初期ID（オプション、通常はルーティングから取得）
   */
  initialId?: string;
};

/**
 * S{ScreenName}コンポーネント
 * 
 * {DomainName}の詳細を表示する画面
 */
const Component: FC<Props> = ({ initialId }) => {
  // ルーターの使用
  const router = useRouter();
  const id = (initialId || router.query.id as string);
  
  // フックの使用
  const { get{DomainName}, delete{DomainName} } = use{DomainName}();
  
  // データの取得
  const { {domainName}, isLoading, isError, mutate } = get{DomainName}(id);
  
  // ローカルステート
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // イベントハンドラ
  const handleBack = () => {
    router.push('/{domainName}s');
  };
  
  const handleEdit = () => {
    router.push(`/{domainName}s/${id}/edit`);
  };
  
  const handleDelete = async () => {
    if (!window.confirm('本当に削除しますか？')) {
      return;
    }
    
    setIsDeleting(true);
    setError(null);
    
    try {
      const result = await delete{DomainName}(id);
      
      if (result.success) {
        router.push('/{domainName}s');
      } else {
        setError('削除に失敗しました。もう一度お試しください。');
      }
    } catch (err) {
      setError('予期せぬエラーが発生しました。');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // レンダリング
  return (
    <div className="screen">
      <div className="screen__header">
        <h1 className="screen__title">{DomainName}詳細</h1>
        <div className="screen__actions">
          <EButton
            label="戻る"
            variant="outline"
            onClick={handleBack}
            disabled={isDeleting}
          />
          {!isLoading && {domainName} && (
            <>
              <EButton
                label="編集"
                variant="secondary"
                onClick={handleEdit}
                disabled={isDeleting}
              />
              <EButton
                label="削除"
                variant="danger"
                onClick={handleDelete}
                disabled={isDeleting}
              />
            </>
          )}
        </div>
      </div>
      
      {error && <div className="screen__error">{error}</div>}
      
      <div className="screen__content">
        {isLoading && <div className="screen__loading">読み込み中...</div>}
        {isError && <div className="screen__error">データの取得に失敗しました</div>}
        
        {!isLoading && !isError && {domainName} ? (
          <div className="screen__detail">
            <h2>{{{domainName}.name}}</h2>
            
            <div className="screen__info">
              <div className="screen__info-item">
                <span className="screen__info-label">ID:</span>
                <span className="screen__info-value">{{{domainName}.id}}</span>
              </div>
              
              {/* 他のフィールド... */}
              
              <div className="screen__info-item">
                <span className="screen__info-label">作成日:</span>
                <span className="screen__info-value">
                  {new Date({domainName}.createdAt).toLocaleString()}
                </span>
              </div>
              
              <div className="screen__info-item">
                <span className="screen__info-label">更新日:</span>
                <span className="screen__info-value">
                  {new Date({domainName}.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
            
            {/* 関連するテンプレートの使用例 */}
            <div className="screen__related">
              <h3>関連情報</h3>
              <T{TemplateName}
                title="関連{DomainName}"
                className="screen__template"
              />
            </div>
          </div>
        ) : (
          <div className="screen__not-found">
            {DomainName}が見つかりません
          </div>
        )}
      </div>
    </div>
  );
};

// コンポーネントをエクスポート
export { Component as S{ScreenName} };

/**
 * プライベートコンポーネント（このファイル内でのみ使用）
 */
const InfoItem: FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => {
  return (
    <div className="info-item">
      <span className="info-item__label">{label}:</span>
      <span className="info-item__value">{value}</span>
    </div>
  );
};
```

## 使用例

```typescript
// SUserShowScreen/index.tsx
import { FC, useState } from 'react';
import { useRouter } from 'next/router';
import { EButton } from 'front/components/01_elements/EButton';
import { TUserPrompts } from 'front/components/03_templates/TUserPrompts';
import { useUser } from 'front/hooks/resources/useUser';

type Props = {
  initialId?: string;
};

const Component: FC<Props> = ({ initialId }) => {
  const router = useRouter();
  const id = (initialId || router.query.id as string);
  
  const { getUser, deleteUser } = useUser();
  const { user, isLoading, isError } = getUser(id);
  
  // 実装の詳細...
  
  return (
    <div className="user-screen">
      {/* スクリーンの内容... */}
    </div>
  );
};

export { Component as SUserShowScreen };
```

## ページでの使用例

```typescript
// app/users/[id]/page.tsx
import { SUserShowScreen } from 'front/components/04_screens/SUserShowScreen';

export default function UserPage({ params }: { params: { id: string } }) {
  return <SUserShowScreen initialId={params.id} />;
}
