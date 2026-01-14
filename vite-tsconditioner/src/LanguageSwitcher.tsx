import React, {type JSX} from 'react';
import Select, {type SingleValue } from 'react-select';
import UKFlag from '../assets/flags/UK.svg';
import FRFlag from '../assets/flags/FR.svg';
import ITFlag from '../assets/flags/IT.svg';
import SPFlag from '../assets/flags/SP.svg';
import i18next from 'i18next';

// Définition du component pour les options de sélection
interface LanguageOption {
    value: string;
    label: JSX.Element;
}

const options: LanguageOption[] = [
    { value: 'en', label: <><img src={UKFlag} alt="en" style={{ width: '20px', marginRight: '8px' }} /> en</> },
    { value: 'fr', label: <><img src={FRFlag} alt="fr" style={{ width: '20px', marginRight: '8px' }} /> fr</> },
    { value: 'it', label: <><img src={ITFlag} alt="it" style={{ width: '20px', marginRight: '8px' }} /> it</> },
    { value: 'es', label: <><img src={SPFlag} alt="es" style={{ width: '20px', marginRight: '8px' }} /> es</> },
];

const LanguageSwitcher: React.FC = () => {
    const handleChange = (selectedOption: SingleValue<LanguageOption>) => {
        if (selectedOption) {
            console.log('Changing language to:', selectedOption.value); // Débogage
            i18next.changeLanguage(selectedOption.value)
                .then(() => {
                    console.log(`Language changed to ${selectedOption.value}`);
                })
                .catch((error) => {
                    console.error('Error changing language:', error);
                });
        }
    };

    return (
        <Select
            options={options}
            defaultValue={options[0]}
            onChange={handleChange}
            isSearchable={false} // Facultatif : Désactive la recherche si non nécessaire
        />
    );
};

export default LanguageSwitcher;
