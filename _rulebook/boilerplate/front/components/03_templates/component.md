# テンプレートコンポーネントのボイラープレート

## 目的
このファイルは、画面の一部を構成する再利用可能なテンプレートを定義します。
テンプレートコンポーネントは、複数のオーガニズムやエレメントを組み合わせて
より大きな機能単位を形成しますが、フル画面ではありません。

## 配置場所
`front/components/03_templates/T{TemplateName}/index.tsx`

## ルール
1. ファイル名は `index.tsx` とし、適切なディレクトリに配置する
2. ディレクトリ名は `T{TemplateName}` とする（例: `TChatMessageContent`, `TCreateDocumentForm`）
3. Propsの型を定義する（type Props = {...}）
4. コンポーネントを実装する（const Component = (props: Props) => {...}）
5. エクスポートする（export { Component as TTemplateName }）
6. プライベートコンポーネントは同じファイル内に定義し、エクスポートしない
7. 必要に応じてエレメントやオーガニズムコンポーネントを使用する
8. 画面の一部を構成するが、フル画面ではない

## 実装例

```typescript
import { FC } from 'react';
import { EButton } from 'front/components/01_elements/EButton';
import { EInput } from 'front/components/01_elements/EInput';
import { O{OrganismName} } from 'front/components/02_organisms/O{OrganismName}';
import { {DomainName}Entity } from 'common/domains/{domain-name}.entity';
import { use{DomainName} } from 'front/hooks/resources/use{DomainName}';

/**
 * T{TemplateName}のプロパティ
 */
type Props = {
  /**
   * テンプレートのタイトル
   */
  title?: string;

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

  /**
   * 追加のクラス名
   */
  className?: string;
};

/**
 * T{TemplateName}コンポーネント
 * 
 * {DomainName}に関連する画面の一部を構成するテンプレート
 */
const Component: FC<Props> = ({ 
  title = '{DomainName}管理', 
  initialData, 
  onComplete, 
  onCancel,
  className = '' 
}) => {
  // フックの使用
  const { list{DomainName}s } = use{DomainName}();
  
  // データの取得
  const { {domainName}s, isLoading, isError } = list{DomainName}s();
  
  // ローカルステート
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{DomainName}Entity | null>(null);
  
  // イベントハンドラ
  const handleAddNew = () => {
    setSelectedItem(null);
    setIsFormVisible(true);
  };
  
  const handleEdit = ({domainName}: {DomainName}Entity) => {
    setSelectedItem({domainName});
    setIsFormVisible(true);
  };
  
  const handleFormComplete = ({domainName}: {DomainName}Entity) => {
    setIsFormVisible(false);
    if (onComplete) {
      onComplete({domainName});
    }
  };
  
  const handleFormCancel = () => {
    setIsFormVisible(false);
    if (onCancel) {
      onCancel();
    }
  };

  // レンダリング
  return (
    <div className={`template ${className}`}>
      <div className="template__header">
        <h2 className="template__title">{title}</h2>
        <EButton
          label="新規作成"
          variant="primary"
          onClick={handleAddNew}
        />
      </div>
      
      {isLoading && <div className="template__loading">読み込み中...</div>}
      {isError && <div className="template__error">エラーが発生しました</div>}
      
      {!isLoading && !isError && (
        <div className="template__content">
          {isFormVisible ? (
            <O{OrganismName}
              initialData={selectedItem || initialData}
              onComplete={handleFormComplete}
              onCancel={handleFormCancel}
            />
          ) : (
            <div className="template__list">
              {({domainName}s && {domainName}s.length > 0) ? (
                {domainName}s.map(({domainName}) => (
                  <div 
                    key={{domainName}.id} 
                    className="template__item"
                    onClick={() => handleEdit({domainName})}
                  >
                    <h3>{{{domainName}.name}}</h3>
                    {/* 他のフィールド... */}
                  </div>
                ))
              ) : (
                <div className="template__empty">
                  データがありません
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// コンポーネントをエクスポート
export { Component as T{TemplateName} };

/**
 * プライベートコンポーネント（このファイル内でのみ使用）
 */
const ListItem: FC<{ 
  {domainName}: {DomainName}Entity; 
  onSelect: ({domainName}: {DomainName}Entity) => void 
}> = ({ {domainName}, onSelect }) => {
  return (
    <div className="list-item" onClick={() => onSelect({domainName})}>
      <h3 className="list-item__title">{{{domainName}.name}}</h3>
      <p className="list-item__date">
        作成日: {new Date({domainName}.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
};
```

## 使用例

```typescript
// TUserManagement/index.tsx
import { FC, useState } from 'react';
import { EButton } from 'front/components/01_elements/EButton';
import { OUserForm } from 'front/components/02_organisms/OUserForm';
import { UserEntity } from 'common/domains/user.entity';
import { useUser } from 'front/hooks/resources/useUser';

type Props = {
  title?: string;
  initialData?: Partial<UserEntity>;
  onComplete?: (user: UserEntity) => void;
  onCancel?: () => void;
  className?: string;
};

const Component: FC<Props> = ({ 
  title = 'ユーザー管理', 
  initialData, 
  onComplete, 
  onCancel,
  className = '' 
}) => {
  const { listUsers } = useUser();
  const { users, isLoading, isError } = listUsers();
  
  // 実装の詳細...
  
  return (
    <div className={`user-management ${className}`}>
      {/* テンプレートの内容... */}
    </div>
  );
};

export { Component as TUserManagement };
