
import { Home, Users, Calendar, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";

const menuItems = [
  { title: "Dashboard", icon: Home, path: "/" },
  { title: "Clients", icon: Users, path: "/clients" },
  { title: "Schedule", icon: Calendar, path: "/schedule" },
  { title: "Settings", icon: Settings, path: "/settings" },
];

export function AppSidebar() {
  return (
    <Sidebar className="border-r bg-white">
      <SidebarContent>
        <div className="p-6">
          <h1 className="text-3xl font-bold text-blue-600">Moveo</h1>
          <p className="text-gray-600">Senior Move Manager CRM</p>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel className="px-6">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.path} 
                      className="flex items-center gap-3 px-6 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
