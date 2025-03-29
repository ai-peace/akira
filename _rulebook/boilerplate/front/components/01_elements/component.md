# エレメントコンポーネントのボイラープレート

## 目的
このファイルは、ドメインに依存しない基本的なUI要素を定義します。
エレメントコンポーネントは最も小さく、再利用可能なUIの構成要素です。

## 配置場所
`front/components/01_elements/E{ElementName}/index.tsx`

## ルール
1. ファイル名は `index.tsx` とし、適切なディレクトリに配置する
2. ディレクトリ名は `E{ElementName}` とする（例: `EButton`, `EInput`）
3. Propsの型を定義する（type Props = {...}）
4. コンポーネントを実装する（const Component = (props: Props) => {...}）
5. エクスポートする（export { Component as EElementName }）
6. プライベートコンポーネントは同じファイル内に定義し、エクスポートしない
7. ドメイン知識を含めず、純粋なUI要素として実装する
8. プロパティを通じて全ての必要なデータを受け取る

## 実装例

```typescript
import { FC } from 'react';

/**
 * E{ElementName}のプロパティ
 */
type Props = {
  /**
   * コンポーネントのラベル
   */
  label: string;

  /**
   * コンポーネントの種類
   */
  variant?: 'primary' | 'secondary' | 'outline';

  /**
   * 無効状態かどうか
   */
  disabled?: boolean;

  /**
   * クリック時のハンドラ
   */
  onClick?: () => void;

  /**
   * 子要素
   */
  children?: React.ReactNode;
};

/**
 * E{ElementName}コンポーネント
 * 
 * 基本的なUI要素として機能する再利用可能なコンポーネント
 */
const Component: FC<Props> = ({ 
  label, 
  variant = 'primary', 
  disabled = false, 
  onClick, 
  children 
}) => {
  // イベントハンドラ
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  // クラス名の生成
  const getClassName = () => {
    const baseClass = 'element';
    const variantClass = `element--${variant}`;
    const disabledClass = disabled ? 'element--disabled' : '';
    
    return [baseClass, variantClass, disabledClass].filter(Boolean).join(' ');
  };

  // レンダリング
  return (
    <div className={getClassName()} onClick={handleClick}>
      <span className="element__label">{label}</span>
      {children && <div className="element__content">{children}</div>}
    </div>
  );
};

// コンポーネントをエクスポート
export { Component as E{ElementName} };

/**
 * プライベートコンポーネント（このファイル内でのみ使用）
 */
const PrivateComponent: FC<{ text: string }> = ({ text }) => {
  return <span className="private-component">{text}</span>;
};
```

## 使用例

```typescript
// EButton/index.tsx
import { FC } from 'react';

type Props = {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  onClick?: () => void;
};

const Component: FC<Props> = ({ 
  label, 
  variant = 'primary', 
  disabled = false, 
  onClick 
}) => {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const getClassName = () => {
    const baseClass = 'button';
    const variantClass = `button--${variant}`;
    const disabledClass = disabled ? 'button--disabled' : '';
    
    return [baseClass, variantClass, disabledClass].filter(Boolean).join(' ');
  };

  return (
    <button className={getClassName()} onClick={handleClick} disabled={disabled}>
      {label}
    </button>
  );
};

export { Component as EButton };
