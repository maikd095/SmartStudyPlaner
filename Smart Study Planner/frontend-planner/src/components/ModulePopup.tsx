//All imnports
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ModulePopupProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onModuleCreated?: () => void;
}

//Initilize popup
const ModulePopup: React.FC<ModulePopupProps> = ({ open, onOpenChange, onModuleCreated }) => {
    const [name, setName] = useState("");
    const [difficulty, setDifficulty] = useState("medium");
    const [hoursRequired, setHoursRequired] = useState("");
    const [deadline, setDeadline] = useState("");
    const [ects, setEcts] = useState("");
    const [alreadyStudied, setAlreadyStudied] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateModule = async () => {
        setIsLoading(true);

        try {
            //Get userID and validation
            const storedUser = localStorage.getItem("user");
            if (!storedUser) {
                alert("Log in again!");
                return;
            }

            const user = JSON.parse(storedUser);

            // Validation
            if (!name.trim()) {
                alert("Please enter a name");
                setIsLoading(false);
                return;
            }

            if (!deadline) {
                alert("Please enter a deadline");
                setIsLoading(false);
                return;
            }

            if (!ects || Number(ects) <= 0) {
                alert("Please enter a valid number of ECTS");
                setIsLoading(false);
                return;
            }

            if (!hoursRequired || Number(hoursRequired) <= 0) {
                alert("Please enter a valid number of hours");
                setIsLoading(false);
                return;
            }

            if (!alreadyStudied || Number(alreadyStudied) <= 0) {
                alert("Please enter a valid number of hours");
                setIsLoading(false);
                return;
            }

            //Fields how a newModule looks like
            const newModule = {
                name: name.trim(),
                difficulty,
                hoursRequired: Number(hoursRequired),
                deadline,
                ects: Number(ects),
                alreadyStudied: Number(alreadyStudied) || 0,
                user: { userId: user.userId || user.id }
            };

            // Create Module with API-call
            const response = await fetch("https://study-planner-online-275553834411.europe-west3.run.app/api/module", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(newModule)
            });

            console.log("Response status:", response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Error response:", errorText);
                throw new Error(`Error while creating event: ${errorText}`);
            }


            // Reset form
            setName("");
            setDifficulty("medium");
            setHoursRequired("");
            setDeadline("");
            setEcts("");
            setAlreadyStudied("");

            if (onModuleCreated) onModuleCreated();
            onOpenChange(false);


        } catch (error) {
            console.error("Error while creating event:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Layout of popup
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white w-full max-w-md p-0 rounded-xl">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-bold text-gray-900">Add New Module</DialogTitle>
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
                            placeholder="If you can estimate insert here. If not it will be calculated"
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
                            onClick={handleCreateModule}
                            disabled={isLoading}
                        >
                            {isLoading ? "Creating..." : "Create Module"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ModulePopup;