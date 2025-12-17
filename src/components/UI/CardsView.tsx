import React from 'react';
import { ScrollView } from 'react-native';

export const CardsView = ({ details, renderCard }: any) => {
	return (
		<ScrollView
			showsVerticalScrollIndicator={false}
			style={{ maxHeight: 400 }}
			contentContainerStyle={{ flexGrow: 1 }}
			nestedScrollEnabled={true}
		>
			{details?.map(renderCard)}
		</ScrollView>
	);
};
