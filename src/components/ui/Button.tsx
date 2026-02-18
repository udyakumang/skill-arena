'use client'

import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { twMerge } from 'tailwind-merge'

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
    size?: 'sm' | 'md' | 'lg'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none"

        const variants = {
            primary: "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/25",
            secondary: "bg-pink-600 text-white hover:bg-pink-500 shadow-lg shadow-pink-500/25",
            ghost: "hover:bg-slate-800 text-slate-300 hover:text-white",
            outline: "border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
        }

        const sizes = {
            sm: "h-9 px-4 text-sm",
            md: "h-11 px-6 text-base",
            lg: "h-14 px-8 text-lg"
        }

        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={twMerge(baseStyles, variants[variant], sizes[size], className)}
                {...props}
            >
                {children}
            </motion.button>
        )
    }
)
Button.displayName = "Button"
