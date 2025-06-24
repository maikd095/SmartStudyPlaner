import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
    isVisible: boolean;
    message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
    isVisible,
    message = "Rescheduling your calendar..."
}) => {
    const [dots, setDots] = useState('');

    useEffect(() => {
        if (!isVisible) {
            setDots('');
            return;
        }

        // Animierte Punkte für visuellen Effekt
        const interval = setInterval(() => {
            setDots(prev => {
                if (prev === '...') return '';
                return prev + '.';
            });
        }, 500);

        return () => clearInterval(interval);
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Blurred Background */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

            {/* Loading Card */}
            <Card className="relative bg-white border border-gray-300 rounded-2xl p-8 shadow-2xl max-w-md mx-4">
                <div className="flex flex-col items-center space-y-6">
                    {/* Spinner */}
                    <div className="relative">
                        <Loader2 className="h-12 w-12 text-[#002366] animate-spin" />
                    </div>

                    {/* Message */}
                    <div className="text-center space-y-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                            Please wait
                        </h3>
                        <p className="text-gray-600">
                            {message}{dots}
                        </p>
                    </div>

                    {/* Progress indication */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-[#002366] h-2 rounded-full animate-pulse w-full" />
                    </div>

                    <div className="text-sm text-gray-500">
                        Processing...
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default LoadingOverlay;