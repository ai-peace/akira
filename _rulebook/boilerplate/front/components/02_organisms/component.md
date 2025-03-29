# オーガニズムコンポーネントのボイラープレート

## 目的
このファイルは、ドメインに依存するコンポーネントを定義します。
オーガニズムコンポーネントは複数のエレメントを組み合わせた機能単位で、
特定のドメイン知識を持ちます。

## 配置場所
`front/components/02_organisms/O{OrganismName}/index.tsx`

## ルール
1. ファイル名は `index.tsx` とし、適切なディレクトリに配置する
2. ディレクトリ名は `O{OrganismName}` とする（例: `OBottomLoginButton`, `OChatBubbleProduct`）
3. Propsの型を定義する（type Props = {...}）
4. コンポーネントを実装する（const Component = (props: Props) => {...}）
5. エクスポートする（export { Component as OOrganismName }）
6. プライベートコンポーネントは同じファイル内に定義し、エクスポートしない
7. ドメイン知識を含み、特定のビジネスロジックに関連する
8. 必要に応じてエレメントコンポーネントを使用する

## 実装例

```typescript
import { FC } from 'react';
import { EButton } from 'front/components/01_elements/EButton';
import { EInput } from 'front/components/01_elements/EInput';
import { {DomainName}Entity } from 'common/domains/{domain-name}.entity';
import { use{DomainName} } from 'front/hooks/resources/use{DomainName}';

/**
 * O{OrganismName}のプロパティ
 */
type Props = {
  /**
   * 初期データ（オプション）
   */
  initialData?: Partial<{DomainName}Entity>;

  /**
   * 完了時のコールバック
   */
  onComplete?: ({domainName}: {DomainName}Entity) => void;

  /**
   * キャンセル時のコールバック
   */
  onCancel?: () => void;
};

/**
 * O{OrganismName}コンポーネント
 * 
 * {DomainName}に関連する機能を提供するコンポーネント
 */
const Component: FC<Props> = ({ initialData, onComplete, onCancel }) => {
  // フックの使用
  const { create{DomainName} } = use{DomainName}();
  
  // ローカルステート
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    // 他のフィールド...
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // イベントハンドラ
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await create{DomainName}(formData);
      
      if (result.error) {
        setError('エラーが発生しました。もう一度お試しください。');
      } else if (result.{domainName} && onComplete) {
        onComplete(result.{domainName});
      }
    } catch (err) {
      setError('予期せぬエラーが発生しました。');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  // レンダリング
  return (
    <div className="organism">
      <h3 className="organism__title">{DomainName}フォーム</h3>
      
      {error && <div className="organism__error">{error}</div>}
      
      <div className="organism__form">
        <EInput
          label="名前"
          value={formData.name}
          onChange={(value) => handleChange('name', value)}
          disabled={isSubmitting}
        />
        
        {/* 他のフォームフィールド... */}
        
        <div className="organism__actions">
          <EButton
            label="キャンセル"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          />
          <EButton
            label="保存"
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

// コンポーネントをエクスポート
export { Component as O{OrganismName} };

/**
 * プライベートコンポーネント（このファイル内でのみ使用）
 */
const FormField: FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
  return (
    <div className="form-field">
      <label className="form-field__label">{label}</label>
      <div className="form-field__input">{children}</div>
    </div>
  );
};
```

## 使用例

```typescript
// OUserForm/index.tsx
import { FC, useState } from 'react';
import { EButton } from 'front/components/01_elements/EButton';
import { EInput } from 'front/components/01_elements/EInput';
import { UserEntity } from 'common/domains/user.entity';
import { useUser } from 'front/hooks/resources/useUser';

type Props = {
  initialData?: Partial<UserEntity>;
  onComplete?: (user: UserEntity) => void;
  onCancel?: () => void;
};

const Component: FC<Props> = ({ initialData, onComplete, onCancel }) => {
  const { createUser } = useUser();
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
  });
  
  // 実装の詳細...
  
  return (
    <div className="user-form">
      {/* フォームの内容... */}
    </div>
  );
};

export { Component as OUserForm };
