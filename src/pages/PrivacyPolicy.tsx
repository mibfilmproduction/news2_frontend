import React from 'react';
import SEO from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <SEO
        title="Privacy Policy"
        description="Privacy Policy for Mibnews - How we handle your data. Learn about our practices regarding the collection, use, and disclosure of your information."
        url="/privacy-policy"
        keywords={['privacy policy', 'mibnews privacy', 'data protection', 'mibnews']}
      />

      <h1 className="text-3xl font-bold mb-8 text-center">Privacy Policy</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Introduction</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <p>
            At Mibnews, we are committed to protecting your privacy and ensuring the security of your personal information.
            This Privacy Policy outlines our practices regarding the collection, use, and disclosure of your information
            when you use our website and services.
          </p>
          <p>
            By using Mibnews, you agree to the collection and use of information in accordance with this policy.
            We will not use or share your information with anyone except as described in this Privacy Policy.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Information Collection and Use</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <h3 className="text-xl font-semibold mb-4">Personal Data</h3>
          <p>
            While using our service, we may ask you to provide us with certain personally identifiable information
            that can be used to contact or identify you. This may include, but is not limited to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Email address</li>
            <li>First name and last name</li>
            <li>Phone number</li>
            <li>Address, State, Province, ZIP/Postal code, City</li>
            <li>Cookies and usage data</li>
          </ul>

          <h3 className="text-xl font-semibold mb-4">Usage Data</h3>
          <p>
            We may also collect information on how the service is accessed and used. This usage data may include
            information such as your computer's Internet Protocol address (e.g., IP address), browser type,
            browser version, the pages of our service that you visit, the time and date of your visit,
            the time spent on those pages, unique device identifiers, and other diagnostic data.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Use of Data</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <p>Mibnews uses the collected data for various purposes:</p>
          <ul className="list-disc pl-6">
            <li>To provide and maintain our service</li>
            <li>To notify you about changes to our service</li>
            <li>To provide customer support</li>
            <li>To gather analysis or valuable information so that we can improve our service</li>
            <li>To monitor the usage of our service</li>
            <li>To detect, prevent and address technical issues</li>
            <li>To provide you with news, special offers and general information about other goods, services and events which we offer</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Data Security</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <p>
            The security of your data is important to us, but remember that no method of transmission over the Internet,
            or method of electronic storage is 100% secure. While we strive to use commercially acceptable means
            to protect your personal data, we cannot guarantee its absolute security.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Data Protection Rights</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <p>You have the following data protection rights:</p>
          <ul className="list-disc pl-6">
            <li>The right to access, update or to delete the information we have on you</li>
            <li>The right of rectification - the right to have your information corrected if it is inaccurate or incomplete</li>
            <li>The right to object - the right to object to our processing of your personal data</li>
            <li>The right of restriction - the right to request that we restrict the processing of your personal information</li>
            <li>The right to data portability - the right to be provided with a copy of your personal data in a structured, machine-readable format</li>
            <li>The right to withdraw consent - the right to withdraw your consent at any time where we relied on your consent to process your personal information</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Changes to This Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
            You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Us</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <p>
            If you have any questions about this Privacy Policy, please contact us:
          </p>
          <ul className="list-disc pl-6">
            <li>By email: privacy@mibnews.in</li>
            <li>By visiting the contact page on our website</li>
            <li>By phone: +1 234 567 8900</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;
