
import { CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PLAN_FEATURES } from "./constants";

interface PlanCardProps {
  type: "free" | "monthly" | "annual";
  selectedPlan: "free" | "monthly" | "annual" | null;
  onSelect: (plan: "free" | "monthly" | "annual") => void;
}

export function PlanCard({ type, selectedPlan, onSelect }: PlanCardProps) {
  const planConfig = {
    free: {
      title: "Free Trial",
      description: "Perfect for testing our services",
      price: "$0",
      period: "/month",
      features: PLAN_FEATURES.free,
      buttonText: "Start Free Trial",
    },
    monthly: {
      title: "Monthly Plan",
      description: "Perfect for short-term projects",
      price: "$15",
      period: "/month",
      features: PLAN_FEATURES.monthly,
      buttonText: "Select Monthly",
    },
    annual: {
      title: "Annual Plan",
      description: "Save 33% with yearly billing",
      price: "$120",
      period: "/year",
      features: PLAN_FEATURES.annual,
      buttonText: "Select Annual",
    },
  };

  const config = planConfig[type];

  return (
    <Card className={`border-2 transition-all ${selectedPlan === type ? "border-primary" : "border-transparent"}`}>
      <CardHeader>
        <CardTitle>{config.title}</CardTitle>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">
          {config.price}<span className="text-sm font-normal text-gray-500">{config.period}</span>
        </p>
        <ul className="mt-4 space-y-2">
          {config.features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button 
          variant={selectedPlan === type ? "default" : "outline"} 
          className="w-full"
          onClick={() => onSelect(type)}
        >
          {config.buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
}
