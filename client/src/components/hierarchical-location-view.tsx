
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, MapPin, Users } from "lucide-react";

interface Constituency {
  id: string;
  name: string;
  code: string;
  district: string;
  state: string;
  totalVoters: number;
}

interface Ward {
  id: string;
  name: string;
  code: string;
  totalVoters: number;
  constituencyId: string;
}

interface Centre {
  id: string;
  name: string;
  code: string;
  registeredVoters: number;
  wardId: string;
}

interface HierarchyData {
  constituencies: Constituency[];
  wards: Ward[];
  centres: Centre[];
}

export default function HierarchicalLocationView() {
  const { data, isLoading, error } = useQuery<HierarchyData>({
    queryKey: ['constituencies-hierarchy'],
    queryFn: async () => {
      const response = await fetch('/api/constituencies/hierarchy');
      if (!response.ok) {
        throw new Error('Failed to fetch hierarchy data');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Failed to load location hierarchy</p>
            <p className="text-sm text-gray-500 mt-1">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || (!data.constituencies?.length && !data.wards?.length && !data.centres?.length)) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No location data available</p>
            <p className="text-sm mt-1">
              Import constituency and ward data to view the hierarchy
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group data by constituency
  const groupedData = data.constituencies?.map(constituency => ({
    ...constituency,
    wards: data.wards?.filter(ward => ward.constituencyId === constituency.id) || [],
  })).map(constituency => ({
    ...constituency,
    wards: constituency.wards.map(ward => ({
      ...ward,
      centres: data.centres?.filter(centre => centre.wardId === ward.id) || [],
    })),
  })) || [];

  const totalConstituencies = data.constituencies?.length || 0;
  const totalWards = data.wards?.length || 0;
  const totalCentres = data.centres?.length || 0;
  const totalVoters = data.centres?.reduce((sum, centre) => sum + centre.registeredVoters, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Constituencies</p>
                <p className="text-2xl font-bold">{totalConstituencies}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Wards</p>
                <p className="text-2xl font-bold">{totalWards}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Centres</p>
                <p className="text-2xl font-bold">{totalCentres}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Total Voters</p>
                <p className="text-2xl font-bold">{totalVoters.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hierarchical View */}
      <div className="space-y-4">
        {groupedData.length > 0 ? (
          groupedData.map(constituency => (
            <Card key={constituency.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-blue-500" />
                    <span>{constituency.name}</span>
                    <Badge variant="secondary">{constituency.code}</Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    {constituency.district}, {constituency.state}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {constituency.wards.length > 0 ? (
                  <div className="space-y-3">
                    {constituency.wards.map(ward => (
                      <div key={ward.id} className="border-l-2 border-green-200 pl-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Building className="h-4 w-4 text-green-500" />
                            <span className="font-medium">{ward.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {ward.code}
                            </Badge>
                          </div>
                          <span className="text-sm text-gray-500">
                            {ward.totalVoters.toLocaleString()} voters
                          </span>
                        </div>
                        
                        {ward.centres.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ml-4">
                            {ward.centres.map(centre => (
                              <div key={centre.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                <div className="flex items-center space-x-1">
                                  <Building className="h-3 w-3 text-orange-500" />
                                  <span className="truncate">{centre.name}</span>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {centre.registeredVoters}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">No wards configured</p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                <p>No constituency data available</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
