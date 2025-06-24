import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ModuleItem {
    id: number;
    name: string;
    hoursRequired: number;
    deadline: string;
    ects: number;
    alreadyStudied: number;
    difficulty: string;
}

interface EditModulePopupProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onModuleUpdated?: () => void;
    module: ModuleItem | null;
}

const EditModulePopup: React.FC<EditModulePopupProps> = ({
    open,
    onOpenChange,
    onModuleUpdated,
    module
}) => {
    const [name, setName] = useState("");
    const [difficulty, setDifficulty] = useState("mittel");
    const [hoursRequired, setHoursRequired] = useState("");
    const [deadline, setDeadline] = useState("");
    const [ects, setEcts] = useState("");
    const [alreadyStudied, setAlreadyStudied] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Populate form fields when module prop changes
    useEffect(() => {
        if (module) {
            setName(module.name);
            setDifficulty(module.difficulty);
            setHoursRequired(module.hoursRequired.toString());
            setDeadline(module.deadline);
            setEcts(module.ects.toString());
            setAlreadyStudied(module.alreadyStudied.toString());
        }
    }, [module]);

    // Reset form when popup closes
    useEffect(() => {
        if (!open) {
            setName("");
            setDifficulty("mittel");
            setHoursRequired("");
            setDeadline("");
            setEcts("");
            setAlreadyStudied("");
        }
    }, [open]);

    const handleUpdateModule = async () => {
        if (!module) return;

        setIsLoading(true);

        try {
            // Validation
            if (!name.trim()) {
                alert("Modulname ist erforderlich.");
                setIsLoading(false);
                return;
            }

            if (!deadline) {
                alert("Deadline ist erforderlich.");
                setIsLoading(false);
                return;
            }

            if (!ects || Number(ects) <= 0) {
                alert("ECTS muss eine positive Zahl sein.");
                setIsLoading(false);
                return;
            }

            if (!hoursRequired || Number(hoursRequired) <= 0) {
                alert("Benötigte Stunden müssen eine positive Zahl sein.");
                setIsLoading(false);
                return;
            }

            const updatedModule = {
                name: name.trim(),
                difficulty,
                hoursRequired: Number(hoursRequired),
                deadline,
                ects: Number(ects),
                alreadyStudied: Number(alreadyStudied) || 0
            };

            console.log("Updating module data:", updatedModule);

            const response = await fetch(`http://localhost:8080/api/module/${module.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(updatedModule)
            });

            console.log("Response status:", response.status);

            if (!response.ok) {
                let errorMessage = `HTTP Error ${response.status}`;
                try {
                    const errorText = await response.text();
                    if (errorText) {
                        errorMessage = errorText;
                    }
                } catch (textError) {
                    // Ignore text parsing errors
                    console.warn("Could not parse error response as text:", textError);
                }
                console.error("Error response:", errorMessage);
                throw new Error(`Fehler beim Aktualisieren des Moduls: ${errorMessage}`);
            }

            // Try to parse response, but don't fail if it's empty or not JSON
            try {
                const responseData = await response.text();
                if (responseData) {
                    console.log("Update response:", responseData);
                }
            } catch (parseError) {
                // Ignore parsing errors - the update was successful based on status code
                console.log("Response parsing skipped (likely empty response)");
            }

            console.log("Module updated successfully");

            if (onModuleUpdated) onModuleUpdated();
            onOpenChange(false);

        } catch (error) {
            console.error("Fehler beim Aktualisieren des Moduls:", error);
            alert("Fehler beim Aktualisieren des Moduls. Bitte versuchen Sie es erneut.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!module) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white w-full max-w-md p-0 rounded-xl">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-bold text-gray-900">Edit Module</DialogTitle>
                </DialogHeader>
                <div className="px-6 pb-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Module name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Java"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                        <Select onValueChange={setDifficulty} value={difficulty} disabled={isLoading}>
                            <SelectTrigger className="w-full border-gray-300 bg-white">
                                <SelectValue placeholder="Please choose" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                <SelectItem value="easy">Easy</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Required hours</label>
                        <Input
                            type="number"
                            value={hoursRequired}
                            onChange={(e) => setHoursRequired(e.target.value)}
                            placeholder="Required hours"
                            min="1"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deadline / exam day</label>
                        <Input
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ECTS</label>
                            <Input
                                type="number"
                                value={ects}
                                onChange={(e) => setEcts(e.target.value)}
                                placeholder="e.g. 6"
                                min="1"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Already studied (hours)</label>
                            <Input
                                type="number"
                                value={alreadyStudied}
                                onChange={(e) => setAlreadyStudied(e.target.value)}
                                placeholder="e.g. 8"
                                min="0"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-[#002366] hover:bg-[#001a4d] text-white"
                            onClick={handleUpdateModule}
                            disabled={isLoading}
                        >
                            {isLoading ? "Updating..." : "Update Module"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EditModulePopup;