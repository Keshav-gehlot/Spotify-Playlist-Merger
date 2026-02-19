import React from 'react';
import { MergeState, MergeStatus } from '../types';

interface MergeStatusModalProps {
  state: MergeState;
  onClose: () => void;
  onRetry?: () => void;
}

const MergeStatusModal: React.FC<MergeStatusModalProps> = ({ state, onClose, onRetry }) => {
  if (state.status === MergeStatus.IDLE) return null;

  const isSuccess = state.status === MergeStatus.SUCCESS;
  const isError = state.status === MergeStatus.ERROR;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#181818] border border-[#282828] rounded-xl shadow-2xl max-w-md w-full p-8 text-center">
        
        {/* Status Icon */}
        <div className="mb-6 flex justify-center">
          {isSuccess ? (
            <div className="h-16 w-16 bg-spotify-base rounded-full flex items-center justify-center animate-bounce">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : isError ? (
            <div className="h-16 w-16 bg-red-500 rounded-full flex items-center justify-center">
               <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          ) : (
            <div className="h-16 w-16 relative">
               <div className="absolute inset-0 border-4 border-[#333] rounded-full"></div>
               <div className="absolute inset-0 border-4 border-spotify-base rounded-full border-t-transparent animate-spin"></div>
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold mb-2">
            {isSuccess ? "Merge Complete!" : isError ? "Error" : "Merging Playlists..."}
        </h2>
        
        <p className="text-gray-400 mb-6">{state.message}</p>

        {/* Progress Bar */}
        {!isSuccess && !isError && (
          <div className="w-full bg-[#333] rounded-full h-2 mb-6 overflow-hidden">
            <div 
              className="bg-spotify-base h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${state.progress}%` }}
            ></div>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex flex-col space-y-3">
            {isSuccess && state.resultUrl && (
                <a 
                    href={state.resultUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full bg-white text-black font-bold py-3 px-6 rounded-full hover:bg-gray-200 transition-colors"
                >
                    Open in Spotify
                </a>
            )}
            
            {isError && onRetry && (
                 <button 
                    onClick={onRetry}
                    className="block w-full bg-spotify-base text-black font-bold py-3 px-6 rounded-full hover:bg-spotify-dark transition-colors"
                >
                    Retry
                </button>
            )}

            {(isSuccess || isError) && (
                 <button 
                    onClick={onClose}
                    className="block w-full border border-gray-600 text-white font-bold py-3 px-6 rounded-full hover:border-white transition-colors"
                >
                    Close
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default MergeStatusModal;