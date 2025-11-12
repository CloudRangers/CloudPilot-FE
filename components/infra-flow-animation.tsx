"use client"

import { useState } from "react"
import { MousePointer2, Server, Package, CheckCircle2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function InfraFlowAnimation() {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null)

  const steps = [
    {
      icon: MousePointer2,
      label: "신청 클릭",
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-500/50",
      glowColor: "shadow-blue-500/50",
    },
    {
      icon: Server,
      label: "VM 생성",
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
      borderColor: "border-purple-500/50",
      glowColor: "shadow-purple-500/50",
    },
    {
      icon: Package,
      label: "패키지 설치",
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/20",
      borderColor: "border-cyan-500/50",
      glowColor: "shadow-cyan-500/50",
    },
    {
      icon: CheckCircle2,
      label: "생성 완료",
      color: "text-green-400",
      bgColor: "bg-green-500/20",
      borderColor: "border-green-500/50",
      glowColor: "shadow-green-500/50",
    },
  ]

  return (
    <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 backdrop-blur-sm border border-primary-foreground/10 shadow-2xl overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary-foreground rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-primary-foreground rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative">
        <div className="h-8 mb-6 flex items-center justify-center">
          <h3 className="text-xl font-bold text-primary-foreground text-center">간편한 인프라 구축 프로세스</h3>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isHovered = hoveredStep === index
            const isActive = hoveredStep !== null && hoveredStep >= index

            return (
              <div key={index} className="flex flex-col items-center">
                <div
                  className="relative group w-full"
                  onMouseEnter={() => setHoveredStep(index)}
                  onMouseLeave={() => setHoveredStep(null)}
                >
                  <div
                    className={cn(
                      "absolute inset-0 rounded-xl blur-xl transition-all duration-500 pointer-events-none",
                      step.bgColor,
                      isHovered ? "opacity-70 scale-125" : "opacity-0 scale-100",
                    )}
                  />

                  <div
                    className={cn(
                      "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-500 cursor-pointer",
                      step.bgColor,
                      step.borderColor,
                      "backdrop-blur-sm",
                      isHovered
                        ? `scale-110 shadow-2xl ${step.glowColor} -translate-y-2`
                        : "scale-100 shadow-lg translate-y-0",
                    )}
                  >
                    <div
                      className={cn(
                        "relative transition-all duration-500",
                        isHovered ? "scale-125 rotate-[360deg]" : "scale-100 rotate-0",
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-10 h-10 transition-all duration-500",
                          step.color,
                          isHovered && "drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]",
                        )}
                      />

                      {isHovered && (
                        <>
                          <div className="absolute inset-0 animate-ping pointer-events-none">
                            <Icon className={cn("w-10 h-10 opacity-50", step.color)} />
                          </div>
                          <div className="absolute inset-0 animate-pulse pointer-events-none">
                            <Icon className={cn("w-10 h-10 opacity-30", step.color)} />
                          </div>
                        </>
                      )}
                    </div>

                    <span
                      className={cn(
                        "text-xs font-bold text-primary-foreground transition-all duration-300 text-center whitespace-nowrap",
                        isHovered && "scale-110 text-shadow",
                      )}
                    >
                      {step.label}
                    </span>

                    <div
                      className={cn(
                        "absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                        step.bgColor,
                        step.borderColor,
                        "border-2 text-primary-foreground shadow-lg",
                        isHovered && "scale-125 rotate-12",
                      )}
                    >
                      {index + 1}
                    </div>

                    {index === steps.length - 1 && (
                      <div
                        className={cn(
                          "absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full transition-all duration-300 pointer-events-none",
                          isHovered ? "opacity-100" : "opacity-0",
                        )}
                      >
                        <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-bounce">
                          완료!
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {index < steps.length - 1 && (
                  <div className="flex items-center justify-center mt-2 pointer-events-none">
                    <ArrowRight
                      className={cn(
                        "w-5 h-5 text-primary-foreground/60 transition-all duration-500",
                        isActive && "text-primary-foreground scale-125 animate-pulse",
                      )}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="h-2 mb-2">
          <div className="h-full bg-primary-foreground/10 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 via-cyan-500 to-green-500 transition-all duration-700 rounded-full relative"
              style={{
                width: hoveredStep !== null ? `${((hoveredStep + 1) / steps.length) * 100}%` : "0%",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="h-6 mt-2 flex items-center justify-center">
          {hoveredStep !== null && (
            <div className="text-center text-primary-foreground/80 text-sm font-semibold animate-fade-in">
              진행률: {Math.round(((hoveredStep + 1) / steps.length) * 100)}%
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
