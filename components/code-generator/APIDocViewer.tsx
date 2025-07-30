'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Globe, Lock } from 'lucide-react';
import { useLanguageStore } from '@/lib/stores/language-store';

interface APIDocViewerProps {
  spec: any;
}

interface EndpointProps {
  path: string;
  method: string;
  operation: any;
}

export function APIDocViewer({ spec }: APIDocViewerProps) {
  const { language } = useLanguageStore();
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());

  if (!spec || !spec.paths) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">
          {language === 'zh' ? '没有API文档' : 'No API documentation'}
        </p>
      </div>
    );
  }

  const toggleEndpoint = (key: string) => {
    const newExpanded = new Set(expandedEndpoints);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedEndpoints(newExpanded);
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      get: 'bg-blue-100 text-blue-700',
      post: 'bg-green-100 text-green-700',
      put: 'bg-yellow-100 text-yellow-700',
      delete: 'bg-red-100 text-red-700',
      patch: 'bg-purple-100 text-purple-700'
    };
    return colors[method.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  const renderEndpoint = ({ path, method, operation }: EndpointProps) => {
    const key = `${method}-${path}`;
    const isExpanded = expandedEndpoints.has(key);

    return (
      <div key={key} className="border-b border-gray-200">
        <div
          className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer"
          onClick={() => toggleEndpoint(key)}
        >
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
          
          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getMethodColor(method)}`}>
            {method}
          </span>
          
          <div className="flex-1">
            <code className="text-sm font-mono">{path}</code>
          </div>
          
          <div className="text-sm text-gray-600">
            {operation.summary}
          </div>
        </div>
        
        {isExpanded && (
          <div className="px-4 pb-4 pl-16">
            <div className="space-y-4">
              {operation.description && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">
                    {language === 'zh' ? '描述' : 'Description'}
                  </h4>
                  <p className="text-sm text-gray-600">{operation.description}</p>
                </div>
              )}
              
              {operation.parameters && operation.parameters.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    {language === 'zh' ? '参数' : 'Parameters'}
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b border-gray-200">
                          <th className="pb-2">{language === 'zh' ? '名称' : 'Name'}</th>
                          <th className="pb-2">{language === 'zh' ? '位置' : 'In'}</th>
                          <th className="pb-2">{language === 'zh' ? '类型' : 'Type'}</th>
                          <th className="pb-2">{language === 'zh' ? '必需' : 'Required'}</th>
                          <th className="pb-2">{language === 'zh' ? '描述' : 'Description'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {operation.parameters.map((param: any, idx: number) => (
                          <tr key={idx} className="border-b border-gray-100">
                            <td className="py-2 font-mono">{param.name}</td>
                            <td className="py-2">{param.in}</td>
                            <td className="py-2">{param.schema?.type || 'string'}</td>
                            <td className="py-2">
                              {param.required ? (
                                <span className="text-red-600">*</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-2 text-gray-600">{param.description || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {operation.requestBody && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    {language === 'zh' ? '请求体' : 'Request Body'}
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600 mb-2">
                      {operation.requestBody.description}
                    </p>
                    {operation.requestBody.required && (
                      <span className="text-xs text-red-600">
                        {language === 'zh' ? '* 必需' : '* Required'}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  {language === 'zh' ? '响应' : 'Responses'}
                </h4>
                <div className="space-y-2">
                  {Object.entries(operation.responses).map(([code, response]: [string, any]) => (
                    <div key={code} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-mono text-sm ${
                          code.startsWith('2') ? 'text-green-600' : 
                          code.startsWith('4') ? 'text-yellow-600' : 
                          'text-red-600'
                        }`}>
                          {code}
                        </span>
                        <span className="text-sm text-gray-700">{response.description}</span>
                      </div>
                      {response.content && (
                        <div className="mt-2 text-xs text-gray-500">
                          {language === 'zh' ? '返回格式：' : 'Content Type: '}
                          {Object.keys(response.content).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">{spec.info.title}</h2>
        <p className="text-sm text-gray-600 mt-1">Version {spec.info.version}</p>
        {spec.info.description && (
          <p className="text-gray-700 mt-3">{spec.info.description}</p>
        )}
      </div>
      
      <div className="divide-y divide-gray-200">
        {Object.entries(spec.paths).map(([path, methods]: [string, any]) => 
          Object.entries(methods).map(([method, operation]: [string, any]) => 
            renderEndpoint({ path, method, operation })
          )
        )}
      </div>
    </div>
  );
}