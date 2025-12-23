import { Timer, BarChart3, History, Settings, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: '番茄任务', href: '/', icon: Timer },
  { name: '数据统计', href: '/stats', icon: BarChart3 },
  { name: '历史记录', href: '/history', icon: History },
  { name: '设置', href: '/settings', icon: Settings },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  const NavContent = () => (
    <nav className="space-y-2">
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full">
      {/* 桌面端侧边栏 */}
      <aside className="hidden lg:block w-64 border-r border-border bg-card shrink-0">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b border-border px-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                🍅
              </div>
              <span className="text-lg font-bold">番茄土豆</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <NavContent />
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col">
        {/* 移动端顶部栏 */}
        <header className="lg:hidden flex h-16 items-center gap-4 border-b border-border bg-card px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-full flex-col">
                <div className="flex h-16 items-center border-b border-border px-6">
                  <Link to="/" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      🍅
                    </div>
                    <span className="text-lg font-bold">番茄土豆</span>
                  </Link>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  <NavContent />
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              🍅
            </div>
            <span className="text-lg font-bold">番茄土豆</span>
          </Link>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
