export default function Home() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>欢迎使用谜题求解器</h1>
      </header>
      <main className="app-main" style={{ textAlign: 'center', maxWidth: '600px' }}>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#555' }}>
          这是一个通用的谜题求解 Web 应用，目前支持数独求解功能。
          您可以在左侧导航栏中选择不同的谜题类型进行求解。
        </p>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#555', marginTop: '1.5rem' }}>
          更多谜题类型正在开发中，敬请期待...
        </p>
      </main>
    </div>
  )
}