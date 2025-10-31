
import React from 'react';
import { ServiceCategory } from '../types';

interface ServiceCategorySectionProps {
    title: string;
    categories: ServiceCategory[];
    onSelectCategory: (category: ServiceCategory) => void;
    isAlternateBg: boolean;
}

const ServiceCategorySection: React.FC<ServiceCategorySectionProps> = ({ title, categories, onSelectCategory, isAlternateBg }) => {
    return (
        <div className={`py-16 ${isAlternateBg ? 'bg-gray-50' : 'bg-white'}`}>
            <div className="container mx-auto px-6">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">{title}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                    {categories.map(category => (
                        <div 
                            key={category}
                            onClick={() => onSelectCategory(category)}
                            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1.5 border border-transparent hover:border-primary transition-all duration-300 cursor-pointer text-center"
                        >
                            <h3 className="text-lg font-semibold text-gray-700">{category}</h3>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ServiceCategorySection;