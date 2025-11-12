export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container px-4 py-8 md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Cloud Pilot</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              인프라 자동 생성 플랫폼으로 빠르고 안정적인 클라우드 환경을 구축하세요.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">제품</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  기능 소개
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  문서
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  API
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">지원</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  도움말
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  문의하기
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  상태
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p>© 2025 Cloud Pilot. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
