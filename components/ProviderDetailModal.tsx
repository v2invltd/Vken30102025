import React, { useState } from 'react';
import { ServiceProvider, GalleryMedia, Location } from '../types';
import { CloseIcon, ServiceCategoryIcon, StarIcon, PlayIcon, CalendarIcon } from './IconComponents';
import { useAppContext } from '../contexts/AppContext';
import VerifiedBadge from './VerifiedBadge';

type DetailTab = 'About' | 'Services' | 'Gallery' | 'Availability';

interface ProviderDetailModalProps {
  provider: ServiceProvider;
  onBook: (provider: ServiceProvider, type: 'instant' | 'quote') => void;
}

const renderStars = (rating: number) => {
    return (
        <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className="w-5 h-5 text-yellow-400" filled={i < Math.round(rating)} />
            ))}
        </div>
    )
}

const Lightbox: React.FC<{ media: GalleryMedia; onClose: () => void }> = ({ media, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60]" onClick={onClose}>
            <div className="relative w-full max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute -top-10 right-0 text-white text-2xl z-10">&times;</button>
                {media.type === 'image' ? (
                    <img src={media.url} alt={media.description || 'Gallery image'} className="w-full h-auto max-h-[90vh] object-contain rounded-lg" />
                ) : (
                    <div className="aspect-w-16 aspect-h-9">
                        <iframe
                            src={media.url}
                            title={media.description || 'Gallery video'}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full rounded-lg"
                        ></iframe>
                    </div>
                )}
                 {media.description && <p className="text-center text-white mt-2">{media.description}</p>}
            </div>
        </div>
    );
};


const ProviderDetailModal: React.FC<ProviderDetailModalProps> = ({ provider, onBook }) => {
  const { dispatch } = useAppContext();
  const onClose = () => dispatch({ type: 'CLOSE_MODAL' });

  const [activeTab, setActiveTab] = useState<DetailTab>('About');
  const [selectedMedia, setSelectedMedia] = useState<GalleryMedia | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [openServiceIndex, setOpenServiceIndex] = useState<number | null>(null);

  const handleToggleService = (index: number) => {
      setOpenServiceIndex(openServiceIndex === index ? null : index);
  };

  const renderAboutTab = () => (
    <div className="space-y-4 animate-fade-in">
        <p className="text-gray-700 text-md bg-gray-50 p-4 rounded-md">{provider.description}</p>
        
        <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Service Locations</h3>
            <div className="flex flex-wrap gap-2">
                {provider.locations.map(loc => (
                    <span key={loc} className="bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1 rounded-full">
                        {loc}
                    </span>
                ))}
            </div>
        </div>

        {provider.expertise && provider.expertise.length > 0 && (
          <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Expertise</h3>
              <div className="flex flex-wrap gap-2">
                  {provider.expertise.map(skill => (
                      <span key={skill} className="bg-primary bg-opacity-10 text-primary text-sm font-medium px-3 py-1 rounded-full">
                          {skill}
                      </span>
                  ))}
              </div>
          </div>
        )}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3 border-t pt-4">Customer Reviews</h3>
          {provider.reviewsList && provider.reviewsList.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {provider.reviewsList.map((review, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                         <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center">
                                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold mr-3">{review.author.charAt(0)}</div>
                                  <div>
                                      <p className="font-semibold text-gray-800">{review.author}</p>
                                      <p className="text-xs text-gray-500">{new Date(review.date).toLocaleDateString()}</p>
                                  </div>
                              </div>
                              {renderStars(review.rating)}
                         </div>
                         <p className="text-gray-700 text-sm">{review.reviewText}</p>
                      </div>
                  ))}
              </div>
          ) : (
              <div className="text-center py-8">
                  <p className="text-gray-600">This provider doesn't have any reviews yet.</p>
              </div>
          )}
        </div>
    </div>
  );

  const renderServicesTab = () => (
    <div className="space-y-2 animate-fade-in max-h-96 overflow-y-auto pr-2">
        {provider.detailedServices && provider.detailedServices.length > 0 ? (
            provider.detailedServices.map((service, index) => {
                const isOpen = openServiceIndex === index;
                return (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => handleToggleService(index)}
                            className="w-full flex justify-between items-center p-4 text-left bg-gray-50 hover:bg-gray-100 focus:outline-none"
                            aria-expanded={isOpen}
                            aria-controls={`service-panel-${index}`}
                        >
                            <div className="flex items-center">
                                <ServiceCategoryIcon category={provider.category} className="w-6 h-6 text-primary mr-3 flex-shrink-0" />
                                <div className="flex flex-col">
                                    <h4 className="font-bold text-gray-800">{service.name}</h4>
                                    {service.price && !isOpen && <p className="text-xs font-semibold text-primary mt-1">{service.price}</p>}
                                </div>
                            </div>
                            <svg className={`w-5 h-5 text-gray-500 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {isOpen && (
                            <div
                                id={`service-panel-${index}`}
                                className="p-4 bg-white border-t border-gray-200 animate-fade-in"
                            >
                                <p className="text-sm text-gray-600 mb-4">{service.description}</p>
                                <div className="flex justify-between items-center">
                                    {service.price ? 
                                        <p className="text-md font-semibold text-primary">{service.price}</p> 
                                        : <div></div>
                                    }
                                    <button
                                        onClick={() => onBook(provider, provider.allowsInstantBooking ? 'instant' : 'quote')}
                                        className={`text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors ${provider.allowsInstantBooking ? 'bg-accent hover:bg-red-700' : 'bg-primary hover:bg-green-800'}`}
                                    >
                                        {provider.allowsInstantBooking ? 'Book Now' : 'Request Quote'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )
            })
        ) : (
            <div className="text-center py-8">
                <p className="text-gray-600">No detailed services listed. Contact provider for more information.</p>
            </div>
        )}
    </div>
  );

  const renderGalleryTab = () => (
     <div className="animate-fade-in">
        {provider.gallery && provider.gallery.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-96 overflow-y-auto pr-2">
                {provider.gallery.map((media, index) => (
                    <div key={index} className="relative group cursor-pointer" onClick={() => setSelectedMedia(media)}>
                        <img src={media.thumbnailUrl} alt={media.description || `Gallery item ${index+1}`} className="w-full h-32 object-cover rounded-md" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center rounded-md">
                           {media.type === 'video' && <PlayIcon className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-8">
                <p className="text-gray-600">No gallery images or videos have been uploaded yet.</p>
            </div>
        )}
     </div>
  );

  const renderAvailabilityTab = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const blanks = Array(firstDayOfMonth).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const getDayClass = (day: number) => {
        const date = new Date(year, month, day);
        const dateString = date.toISOString().split('T')[0];
        const status = provider.availability?.[dateString];
        
        let classes = "w-10 h-10 flex items-center justify-center rounded-full text-sm";
        if (date < today) return `${classes} text-gray-300 line-through`;
        
        switch(status) {
            case 'available': return `${classes} bg-green-100 text-green-800 font-bold`;
            case 'booked': return `${classes} bg-red-100 text-red-500 line-through`;
            case 'unavailable': return `${classes} bg-gray-200 text-gray-500 line-through`;
            default: return `${classes} text-gray-700`; // Default is considered available but not explicitly marked
        }
    };

    return (
        <div className="animate-fade-in">
             <div className="flex justify-between items-center mb-4">
                <button type="button" onClick={() => setCalendarMonth(new Date(year, month - 1, 1))} className="p-2 rounded-full hover:bg-gray-100">&lt;</button>
                <h3 className="text-md font-semibold text-gray-800">{calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                <button type="button" onClick={() => setCalendarMonth(new Date(year, month + 1, 1))} className="p-2 rounded-full hover:bg-gray-100">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
                {dayHeaders.map(day => <div key={day} className="font-medium">{day}</div>)}
                {blanks.map((_, i) => <div key={`blank-${i}`}></div>)}
                {days.map(day => <div key={day} className={getDayClass(day)}>{day}</div>)}
            </div>
            <div className="flex space-x-4 mt-4 text-xs items-center justify-center border-t pt-3">
                <div className="flex items-center"><span className="w-3 h-3 bg-green-100 rounded-full mr-1.5 border border-green-200"></span>Available</div>
                <div className="flex items-center"><span className="w-3 h-3 bg-red-100 rounded-full mr-1.5 border border-red-200"></span>Booked</div>
                <div className="flex items-center"><span className="w-3 h-3 bg-gray-200 rounded-full mr-1.5 border border-gray-300"></span>Unavailable</div>
            </div>
        </div>
    );
  };


  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" role="dialog" aria-modal="true" aria-labelledby="provider-detail-title">
          <div className="relative">
            <button onClick={onClose} className="absolute top-3 right-3 text-white bg-black bg-opacity-40 p-2 rounded-full z-10 hover:bg-opacity-70">
              <CloseIcon className="w-6 h-6" />
            </button>
            <img src={provider.coverImageUrl || 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1600&h=400&fit=crop'} alt={`${provider.name} cover`} className="w-full h-40 object-cover rounded-t-lg" />
            <img src={provider.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name)}&background=007A33&color=fff&size=128`} alt={`${provider.name} logo`} className="w-24 h-24 rounded-full object-cover border-4 border-white absolute -bottom-12 left-6 bg-white" />
          </div>
          
          <div className="pt-16 p-6 flex-grow overflow-y-auto">
            <div className="flex flex-col md:flex-row justify-between md:items-start mb-4">
                <div className="flex-grow">
                    <div className="flex items-center gap-3">
                      <h2 id="provider-detail-title" className="text-3xl font-bold text-gray-800">{provider.name}</h2>
                      {provider.kycVerified && <VerifiedBadge size="md" />}
                    </div>
                    <div className="flex items-center text-gray-500 mt-1">
                        <ServiceCategoryIcon category={provider.category} className="w-5 h-5 mr-2 text-primary" />
                        <p className="text-md">{provider.category}</p>
                    </div>
                </div>
                <div className="flex items-center mt-3 md:mt-0">
                  <StarIcon className="w-6 h-6 text-yellow-400 mr-1" />
                  <span className="text-gray-800 text-xl font-bold">{provider.rating.toFixed(1)}</span>
                  <span className="text-gray-600 text-md ml-2">({provider.reviewsCount} reviews)</span>
                </div>
            </div>
            
             <div className="mb-4 border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {(['About', 'Services', 'Availability', 'Gallery'] as DetailTab[]).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                           {tab}
                        </button>
                    ))}
                </nav>
             </div>
             <div>
                {activeTab === 'About' && renderAboutTab()}
                {activeTab === 'Services' && renderServicesTab()}
                {activeTab === 'Gallery' && renderGalleryTab()}
                {activeTab === 'Availability' && renderAvailabilityTab()}
             </div>
          </div>

          <div className="p-4 border-t bg-gray-50 flex-shrink-0 rounded-b-lg flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => onBook(provider, 'quote')} 
              className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-green-800 transition-colors"
            >
              Request Quote (Custom Jobs)
            </button>
            {provider.allowsInstantBooking && (
                <button 
                onClick={() => onBook(provider, 'instant')} 
                className="w-full bg-accent text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors"
                >
                Book Now (KES {provider.hourlyRate}/hr)
                </button>
            )}
          </div>
        </div>
      </div>
      {selectedMedia && <Lightbox media={selectedMedia} onClose={() => setSelectedMedia(null)} />}
    </>
  );
};

export default ProviderDetailModal;