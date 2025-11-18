import { shedsService } from './sheeds.service.js';
import { typeChickensService } from './type_chickens.service.js';

class SelectDataManager {
    constructor() {
        this.sheds = [];
        this.chickenTypes = [];
        this.isLoaded = false;
    }

    async loadData() {
        try {
            // Cargar datos en paralelo usando los servicios específicos
            const [shedsData, chickenTypesData] = await Promise.all([
                shedsService.getSheds(),
                typeChickensService.getChickenTypes()
            ]);

            this.sheds = shedsData || [];
            this.chickenTypes = chickenTypesData || [];
            this.isLoaded = true;

            console.log('Datos cargados para selects:', {
                galpones: this.sheds.length,
                tiposGallina: this.chickenTypes.length
            });

        } catch (error) {
            console.error('Error cargando datos para selects:', error);
            this.sheds = [];
            this.chickenTypes = [];
            this.isLoaded = false;
            throw error; // Propagar el error para manejarlo arriba
        }
    }

    getShedOptions() {
        return this.sheds.map(shed => ({
            value: shed.id_galpon,
            text: `${shed.nombre}`,
            data: shed // Guardar datos completos por si se necesitan
        }));
    }

    getChickenTypeOptions() {
        return this.chickenTypes.map(type => ({
            value: type.id_tipo_gallinas,
            text: type.raza || `Tipo ${type.id_tipo_gallinas}`,
            data: type
        }));
    }

    getShedById(id) {
        return this.sheds.find(shed => shed.id_galpon === id);
    }

    getChickenTypeById(id) {
        return this.chickenTypes.find(type => type.id_tipo_gallinas === id);
    }

    // Limpiar cache (útil para cuando se actualizan datos)
    clearCache() {
        this.sheds = [];
        this.chickenTypes = [];
        this.isLoaded = false;
    }
}

export const selectDataManager = new SelectDataManager();