// src/pages/SimulationPage.tsx
import BulkSimulForm from "../BulkSimulForm.tsx";
import { VisualisationContainer } from "../VisualisationContainer.tsx";

import { useSimulation } from "../../hooks/useSimulation";
import { usePolishing } from "../../hooks/usePolishing";
import { postPolishing } from "../../http/polishingApi";
import type { PolishRequest } from "../../types/polishing";

const SimulationPage = () => {
    const { tsData, tsMemId, runSimulation } = useSimulation();

    const { tsContainerJSON, runPolishing } = usePolishing(postPolishing, {
        successMessage: "Processing completed successfully",
        errorPrefix: "Erreur backend (polishing)",
    });

    const handlePolishing = async (request: PolishRequest): Promise<void> => {
        await runPolishing(request); // on “consomme” le retour
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>Simulation</h2>

            <BulkSimulForm onSubmit={runSimulation} />

            <VisualisationContainer
                tsData={tsData}
                tsContainerJSON={tsContainerJSON}
                tsMemId={tsMemId}
                baseLabel="BulkSimul"
                onPolishing={handlePolishing}
            />
        </div>
    );
};

export default SimulationPage;