import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Vote, Shield, BarChart3, Users } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import LanguageSelector from "@/components/language-selector";

export default function Landing() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <Card className="w-full max-w-md mx-auto shadow-2xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Vote className="text-white h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("landing.title")}</h1>
              <p className="text-gray-600">{t("landing.subtitle")}</p>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Shield className="h-5 w-5 text-primary-500" />
                <span>{t("landing.feature_security")}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <BarChart3 className="h-5 w-5 text-primary-500" />
                <span>{t("landing.feature_realtime")}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Users className="h-5 w-5 text-primary-500" />
                <span>{t("landing.feature_access")}</span>
              </div>
            </div>
            
            <Button 
              onClick={() => window.location.href = "/login"}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 transition-colors duration-200"
              data-testid="button-login"
            >
              {t("landing.sign_in")}
            </Button>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                {t("landing.authorized_only")}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center text-white">
          <div className="flex justify-center mb-4">
            <LanguageSelector />
          </div>
          <h2 className="text-3xl font-bold mb-4">{t("landing.monitoring_title")}</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            {t("landing.monitoring_description")}
          </p>
        </div>
      </div>
    </div>
  );
}
